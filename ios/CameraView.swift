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
                                               "photo",
                                               "video",
                                               "enableFrameProcessor",
                                               "pixelFormat",
                                               "previewType"]
private let propsThatRequireDeviceReconfiguration = ["fps",
                                                     "hdr",
                                                     "lowLightBoost"]

// MARK: - CameraView

public final class CameraView: UIView {
  // pragma MARK: React Properties
  // props that require reconfiguring
  @objc var cameraId: NSString?
  @objc var enableDepthData = false
  @objc var enableHighQualityPhotos: NSNumber? // nullable bool
  @objc var enablePortraitEffectsMatteDelivery = false
  // use cases
  @objc var photo: NSNumber? // nullable bool
  @objc var video: NSNumber? // nullable bool
  @objc var audio: NSNumber? // nullable bool
  @objc var enableFrameProcessor = false
  @objc var pixelFormat: NSString?
  // props that require format reconfiguring
  @objc var format: NSDictionary?
  @objc var fps: NSNumber?
  @objc var hdr: NSNumber? // nullable bool
  @objc var lowLightBoost: NSNumber? // nullable bool
  @objc var orientation: NSString?
  // other props
  @objc var isActive = false
  @objc var torch = "off"
  @objc var zoom: NSNumber = 1.0 // in "factor"
  @objc var enableFpsGraph = false
  @objc var videoStabilizationMode: NSString?
  @objc var previewType: NSString = "none"
  // events
  @objc var onInitialized: RCTDirectEventBlock?
  @objc var onError: RCTDirectEventBlock?
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
  // Inputs & Outputs
  internal var videoDeviceInput: AVCaptureDeviceInput?
  internal var audioDeviceInput: AVCaptureDeviceInput?
  internal var photoOutput: AVCapturePhotoOutput?
  internal var videoOutput: AVCaptureVideoDataOutput?
  internal var audioOutput: AVCaptureAudioDataOutput?
  // CameraView+RecordView (+ Frame Processor)
  internal var isRecording = false
  internal var recordingSession: RecordingSession?
  #if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
    @objc public var frameProcessor: FrameProcessor?
  #endif
  #if VISION_CAMERA_ENABLE_SKIA
    internal var skiaRenderer: SkiaRenderer?
  #endif
  // CameraView+Zoom
  internal var pinchGestureRecognizer: UIPinchGestureRecognizer?
  internal var pinchScaleOffset: CGFloat = 1.0

  internal var previewView: PreviewView?
  #if DEBUG
    internal var fpsGraph: RCTFPSGraph?
  #endif

  /// Returns whether the AVCaptureSession is currently running (reflected by isActive)
  var isRunning: Bool {
    return captureSession.isRunning
  }

  // pragma MARK: Setup
  override public init(frame: CGRect) {
    super.init(frame: frame)

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

    setupPreviewView()
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

    if newSuperview != nil {
      if !isMounted {
        isMounted = true
        onViewReady?(nil)
      }
    }
  }

  override public func layoutSubviews() {
    if let previewView = previewView {
      previewView.frame = frame
      previewView.bounds = bounds
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
    let shouldUpdateOrientation = willReconfigure || changedProps.contains("orientation")

    if changedProps.contains("previewType") {
      DispatchQueue.main.async {
        self.setupPreviewView()
      }
    }
    if changedProps.contains("enableFpsGraph") {
      DispatchQueue.main.async {
        self.setupFpsGraph()
      }
    }

    if shouldReconfigure ||
      shouldReconfigureAudioSession ||
      shouldCheckActive ||
      shouldUpdateTorch ||
      shouldUpdateZoom ||
      shouldReconfigureFormat ||
      shouldReconfigureDevice ||
      shouldUpdateVideoStabilization ||
      shouldUpdateOrientation {
      CameraQueues.cameraQueue.async {
        // Video Configuration
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
          CameraQueues.cameraQueue.asyncAfter(deadline: .now() + 0.1) {
            self.setTorchMode(self.torch)
          }
        }
      }

      // Audio Configuration
      if shouldReconfigureAudioSession {
        CameraQueues.audioQueue.async {
          self.configureAudioSession()
        }
      }
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
}
