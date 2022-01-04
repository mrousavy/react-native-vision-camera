//
//  CameraView.swift
//  mrousavy
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

// CameraView+TakePhoto
// TODO: Photo HDR

private let propsThatRequireReconfiguration = ["cameraId",
                                               "enableDepthData",
                                               "enableHighQualityPhotos",
                                               "enablePortraitEffectsMatteDelivery",
                                               "preset",
                                               "photo",
                                               "video",
                                               "enableFrameProcessor"]
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
  @objc var enableHighQualityPhotos: NSNumber? // nullable bool
  @objc var enablePortraitEffectsMatteDelivery = false
  @objc var preset: String?
  // use cases
  @objc var photo: NSNumber? // nullable bool
  @objc var video: NSNumber? // nullable bool
  @objc var audio: NSNumber? // nullable bool
  @objc var enableFrameProcessor = false
  // props that require format reconfiguring
  @objc var format: NSDictionary?
  @objc var fps: NSNumber?
  @objc var frameProcessorFps: NSNumber = -1.0 // "auto"
  @objc var hdr: NSNumber? // nullable bool
  @objc var lowLightBoost: NSNumber? // nullable bool
  @objc var colorSpace: NSString?
  @objc var orientation: NSString?
  // other props
  @objc var isActive = false
  @objc var torch = "off"
  @objc var zoom: NSNumber = 1.0 // in "factor"
  @objc var videoStabilizationMode: NSString?
  // events
  @objc var onInitialized: RCTDirectEventBlock?
  @objc var onError: RCTDirectEventBlock?
  @objc var onFrameProcessorPerformanceSuggestionAvailable: RCTDirectEventBlock?
  @objc var onViewReady: RCTDirectEventBlock?
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
  internal var isMounted = false
  internal var isReady = false
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

  /// Specifies whether the frameProcessor() function is currently executing. used to drop late frames.
  internal var isRunningFrameProcessor = false
  internal let frameProcessorPerformanceDataCollector = FrameProcessorPerformanceDataCollector()
  internal var actualFrameProcessorFps = 30.0
  internal var lastSuggestedFrameProcessorFps = 0.0
  internal var lastFrameProcessorPerformanceEvaluation = DispatchTime.now()

  /// Returns whether the AVCaptureSession is currently running (reflected by isActive)
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
    NotificationCenter.default.addObserver(self,
                                           selector: #selector(onOrientationChanged),
                                           name: UIDevice.orientationDidChangeNotification,
                                           object: nil)
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
    NotificationCenter.default.removeObserver(self,
                                              name: UIDevice.orientationDidChangeNotification,
                                              object: nil)
  }

  override public func willMove(toSuperview newSuperview: UIView?) {
    super.willMove(toSuperview: newSuperview)
    if !isMounted {
      isMounted = true
      guard let onViewReady = onViewReady else {
        return
      }
      onViewReady(nil)
    }
  }

  // pragma MARK: Props updating
  override public final func didSetProps(_ changedProps: [String]!) {
    ReactLogger.log(level: .info, message: "Updating \(changedProps.count) prop(s)...")
    let shouldReconfigure = changedProps.contains { propsThatRequireReconfiguration.contains($0) }
    let shouldReconfigureFormat = shouldReconfigure || changedProps.contains("format")
    let shouldReconfigureDevice = shouldReconfigureFormat || changedProps.contains { propsThatRequireDeviceReconfiguration.contains($0) }
    let shouldReconfigureAudioSession = changedProps.contains("audio")

    let willReconfigure = shouldReconfigure || shouldReconfigureFormat || shouldReconfigureDevice

    let shouldCheckActive = willReconfigure || changedProps.contains("isActive") || captureSession.isRunning != isActive
    let shouldUpdateTorch = willReconfigure || changedProps.contains("torch") || shouldCheckActive
    let shouldUpdateZoom = willReconfigure || changedProps.contains("zoom") || shouldCheckActive
    let shouldUpdateVideoStabilization = willReconfigure || changedProps.contains("videoStabilizationMode")
    let shouldUpdateOrientation = changedProps.contains("orientation")

    if shouldReconfigure ||
      shouldReconfigureAudioSession ||
      shouldCheckActive ||
      shouldUpdateTorch ||
      shouldUpdateZoom ||
      shouldReconfigureFormat ||
      shouldReconfigureDevice ||
      shouldUpdateVideoStabilization ||
      shouldUpdateOrientation {
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
        if shouldUpdateVideoStabilization, let videoStabilizationMode = self.videoStabilizationMode as String? {
          self.captureSession.setVideoStabilizationMode(videoStabilizationMode)
        }

        if shouldUpdateZoom {
          let zoomClamped = max(min(CGFloat(self.zoom.doubleValue), self.maxAvailableZoom), self.minAvailableZoom)
          self.zoom(factor: zoomClamped, animated: false)
          self.pinchScaleOffset = zoomClamped
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

        if shouldUpdateOrientation {
          self.updateOrientation()
        }

        // This is a wack workaround, but if I immediately set torch mode after `startRunning()`, the session isn't quite ready yet and will ignore torch.
        if shouldUpdateTorch {
          self.cameraQueue.asyncAfter(deadline: .now() + 0.1) {
            self.setTorchMode(self.torch)
          }
        }
      }

      // Audio Configuration
      if shouldReconfigureAudioSession {
        audioQueue.async {
          self.configureAudioSession()
        }
      }
    }

    // Frame Processor FPS Configuration
    if changedProps.contains("frameProcessorFps") {
      if frameProcessorFps.doubleValue == -1 {
        // "auto"
        actualFrameProcessorFps = 30.0
      } else {
        actualFrameProcessorFps = frameProcessorFps.doubleValue
      }
      lastFrameProcessorPerformanceEvaluation = DispatchTime.now()
      frameProcessorPerformanceDataCollector.clear()
    }
  }

  internal final func setTorchMode(_ torchMode: String) {
    guard let device = videoDeviceInput?.device else {
      invokeOnError(.session(.cameraNotReady))
      return
    }
    guard var torchMode = AVCaptureDevice.TorchMode(withString: torchMode) else {
      invokeOnError(.parameter(.invalid(unionName: "TorchMode", receivedValue: torch)))
      return
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
        invokeOnError(.device(.torchUnavailable))
        return
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
      invokeOnError(.device(.configureError), cause: error)
      return
    }
  }

  @objc
  func onOrientationChanged() {
    updateOrientation()
  }

  // pragma MARK: Event Invokers
  internal final func invokeOnError(_ error: CameraError, cause: NSError? = nil) {
    ReactLogger.log(level: .error, message: "Invoking onError(): \(error.message)")
    guard let onError = onError else { return }

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
    guard let onInitialized = onInitialized else { return }
    onInitialized([String: Any]())
  }

  internal final func invokeOnFrameProcessorPerformanceSuggestionAvailable(currentFps: Double, suggestedFps: Double) {
    ReactLogger.log(level: .info, message: "Frame Processor Performance Suggestion available!")
    guard let onFrameProcessorPerformanceSuggestionAvailable = onFrameProcessorPerformanceSuggestionAvailable else { return }

    if lastSuggestedFrameProcessorFps == suggestedFps { return }
    if suggestedFps == currentFps { return }

    onFrameProcessorPerformanceSuggestionAvailable([
      "type": suggestedFps > currentFps ? "can-use-higher-fps" : "should-use-lower-fps",
      "suggestedFrameProcessorFps": suggestedFps,
    ])
    lastSuggestedFrameProcessorFps = suggestedFps
  }
}
