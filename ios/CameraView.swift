//
//  CameraView.swift
//  Cuvent
//
//  Created by Marc Rousavy on 09.11.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation
import UIKit

//
// TODOs for the CameraView which are currently too hard to implement either because of AVFoundation's limitations, or my brain capacity
//
// CameraView+RecordVideo
// TODO: Better startRecording()/stopRecording() (promise + callback, wait for TurboModules/JSI)
// TODO: videoStabilizationMode

// CameraView+TakePhoto
// TODO: Photo HDR

private let propsThatRequireReconfiguration = ["cameraId",
                                               "enableDepthData",
                                               "enableHighResolutionCapture",
                                               "enablePortraitEffectsMatteDelivery",
                                               "preset"]
private let propsThatRequireDeviceReconfiguration = ["fps",
                                                     "hdr",
                                                     "lowLightBoost",
                                                     "colorSpace"]

// MARK: - CameraView

public final class CameraView: UIView {
  // pragma MARK: React Properties

  // pragma MARK: Exported Properties
  // props that require reconfiguring
  @objc var cameraId: NSString?
  @objc var enableDepthData = false
  @objc var enableHighResolutionCapture: NSNumber? // nullable bool
  @objc var enablePortraitEffectsMatteDelivery = false
  @objc var preset: String?
  // props that require format reconfiguring
  @objc var format: NSDictionary?
  @objc var fps: NSNumber?
  @objc var frameProcessorFps: NSNumber = 1.0
  @objc var hdr: NSNumber? // nullable bool
  @objc var lowLightBoost: NSNumber? // nullable bool
  @objc var colorSpace: NSString?
  // other props
  @objc var isActive = false
  @objc var torch = "off"
  @objc var zoom: NSNumber = 0.0 // in percent
  // events
  @objc var onInitialized: RCTDirectEventBlock?
  @objc var onError: RCTDirectEventBlock?
  // zoom
  @objc var enableZoomGesture = false {
    didSet {
      if enableZoomGesture {
        addPinchGestureRecognizer()
      } else {
        removePinchGestureRecognizer()
      }
    }
  }

  // pragma MARK: Internal Properties

  internal var isReady = false
  /// The serial execution queue for the camera preview layer (input stream) as well as output processing (take photo and record video)
  internal let queue = DispatchQueue(label: "com.mrousavy.camera-queue", qos: .userInteractive, attributes: [], autoreleaseFrequency: .inherit, target: nil)
  // Capture Session
  internal let captureSession = AVCaptureSession()
  internal let audioCaptureSession = AVCaptureSession()
  // Inputs
  internal var videoDeviceInput: AVCaptureDeviceInput?
  internal var audioDeviceInput: AVCaptureDeviceInput?
  internal var photoOutput: AVCapturePhotoOutput?
  internal var videoOutput: AVCaptureVideoDataOutput?
  internal var audioOutput: AVCaptureAudioDataOutput?
  // CameraView+RecordView (+ FrameProcessorDelegate.mm)
  internal var isRecording = false
  internal var recordingSession: RecordingSession?
  @objc public var frameProcessorCallback: FrameProcessorCallback?
  internal var lastFrameProcessorCall = DispatchTime.now()
  // CameraView+TakePhoto
  internal var photoCaptureDelegates: [PhotoCaptureDelegate] = []
  // CameraView+Zoom
  internal var pinchGestureRecognizer: UIPinchGestureRecognizer?
  internal var pinchScaleOffset: CGFloat = 1.0

  internal let cameraQueue = CameraQueues.cameraQueue
  internal let videoQueue = CameraQueues.videoQueue
  internal let audioQueue = CameraQueues.audioQueue

  var isRunning: Bool {
    return captureSession.isRunning
  }

  /// Convenience wrapper to get layer as its statically known type.
  var videoPreviewLayer: AVCaptureVideoPreviewLayer {
    // swiftlint:disable force_cast
    return layer as! AVCaptureVideoPreviewLayer
  }

  override public class var layerClass: AnyClass {
    return AVCaptureVideoPreviewLayer.self
  }

  // pragma MARK: Setup
  override public init(frame: CGRect) {
    super.init(frame: frame)
    videoPreviewLayer.session = captureSession
    videoPreviewLayer.videoGravity = .resizeAspectFill
    videoPreviewLayer.frame = layer.bounds

    NotificationCenter.default.addObserver(self,
                                           selector: #selector(sessionRuntimeError),
                                           name: .AVCaptureSessionRuntimeError,
                                           object: captureSession)
    NotificationCenter.default.addObserver(self,
                                           selector: #selector(sessionRuntimeError),
                                           name: .AVCaptureSessionRuntimeError,
                                           object: audioCaptureSession)
    NotificationCenter.default.addObserver(self,
                                           selector: #selector(audioSessionInterrupted),
                                           name: AVAudioSession.interruptionNotification,
                                           object: AVAudioSession.sharedInstance)

    audioQueue.async {
      self.configureAudioSession()
    }
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) is not implemented.")
  }

  deinit {
    NotificationCenter.default.removeObserver(self,
                                              name: .AVCaptureSessionRuntimeError,
                                              object: captureSession)
    NotificationCenter.default.removeObserver(self,
                                              name: .AVCaptureSessionRuntimeError,
                                              object: audioCaptureSession)
    NotificationCenter.default.removeObserver(self,
                                              name: AVAudioSession.interruptionNotification,
                                              object: AVAudioSession.sharedInstance)
  }

  // pragma MARK: Props updating
  override public final func didSetProps(_ changedProps: [String]!) {
    ReactLogger.log(level: .info, message: "Updating \(changedProps.count) prop(s)...")
    let shouldReconfigure = changedProps.contains { propsThatRequireReconfiguration.contains($0) }
    let shouldReconfigureFormat = shouldReconfigure || changedProps.contains("format")
    let shouldReconfigureDevice = shouldReconfigureFormat || changedProps.contains { propsThatRequireDeviceReconfiguration.contains($0) }

    let willReconfigure = shouldReconfigure || shouldReconfigureFormat || shouldReconfigureDevice

    let shouldCheckActive = willReconfigure || changedProps.contains("isActive") || captureSession.isRunning != isActive
    let shouldUpdateTorch = willReconfigure || changedProps.contains("torch") || shouldCheckActive
    let shouldUpdateZoom = willReconfigure || changedProps.contains("zoom") || shouldCheckActive

    if shouldReconfigure || shouldCheckActive || shouldUpdateTorch || shouldUpdateZoom || shouldReconfigureFormat || shouldReconfigureDevice {
      cameraQueue.async {
        if shouldReconfigure {
          self.configureCaptureSession()
        }
        if shouldReconfigureFormat {
          self.configureFormat()
        }
        if shouldReconfigureDevice {
          self.configureDevice()
        }

        if shouldUpdateZoom {
          let zoomPercent = CGFloat(max(min(self.zoom.doubleValue, 1.0), 0.0))
          let zoomScaled = (zoomPercent * (self.maxAvailableZoom - self.minAvailableZoom)) + self.minAvailableZoom
          self.zoom(factor: zoomScaled, animated: false)
          self.pinchScaleOffset = zoomScaled
        }

        if shouldCheckActive && self.captureSession.isRunning != self.isActive {
          if self.isActive {
            ReactLogger.log(level: .info, message: "Starting Session...")
            self.captureSession.startRunning()
            ReactLogger.log(level: .info, message: "Started Session!")
          } else {
            ReactLogger.log(level: .info, message: "Stopping Session...")
            self.captureSession.stopRunning()
            ReactLogger.log(level: .info, message: "Stopped Session!")
          }
        }

        // This is a wack workaround, but if I immediately set torch mode after `startRunning()`, the session isn't quite ready yet and will ignore torch.
        self.cameraQueue.asyncAfter(deadline: .now() + 0.1) {
          if shouldUpdateTorch {
            self.setTorchMode(self.torch)
          }
        }
      }
    }
  }

  internal final func setTorchMode(_ torchMode: String) {
    guard let device = videoDeviceInput?.device else {
      return invokeOnError(.session(.cameraNotReady))
    }
    guard var torchMode = AVCaptureDevice.TorchMode(withString: torchMode) else {
      return invokeOnError(.parameter(.invalid(unionName: "TorchMode", receivedValue: torch)))
    }
    if !captureSession.isRunning {
      torchMode = .off
    }
    if device.torchMode == torchMode {
      // no need to run the whole lock/unlock bs
      return
    }
    if !device.hasTorch || !device.isTorchAvailable {
      if torchMode == .off {
        // ignore it, when it's off and not supported, it's off.
        return
      } else {
        // torch mode is .auto or .on, but no torch is available.
        return invokeOnError(.device(.torchUnavailable))
      }
    }
    do {
      try device.lockForConfiguration()
      device.torchMode = torchMode
      if torchMode == .on {
        try device.setTorchModeOn(level: 1.0)
      }
      device.unlockForConfiguration()
    } catch let error as NSError {
      return invokeOnError(.device(.configureError), cause: error)
    }
  }

  // pragma MARK: Event Invokers
  internal final func invokeOnError(_ error: CameraError, cause: NSError? = nil) {
    ReactLogger.log(level: .error, message: "Invoking onError(): \(error.message)")
    guard let onError = self.onError else { return }

    var causeDictionary: [String: Any]?
    if let cause = cause {
      causeDictionary = [
        "code": cause.code,
        "domain": cause.domain,
        "message": cause.description,
        "details": cause.userInfo,
      ]
    }
    onError([
      "code": error.code,
      "message": error.message,
      "cause": causeDictionary ?? NSNull(),
    ])
  }

  internal final func invokeOnInitialized() {
    ReactLogger.log(level: .info, message: "Camera initialized!")
    guard let onInitialized = self.onInitialized else { return }
    onInitialized([String: Any]())
  }
}
