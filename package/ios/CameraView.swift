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
                                               "hdr",
                                               "pixelFormat",
                                               "codeScannerOptions"]
private let propsThatRequireDeviceReconfiguration = ["fps",
                                                     "lowLightBoost"]

// MARK: - CameraView

public final class CameraView: UIView {
  // pragma MARK: React Properties
  // props that require reconfiguring
  @objc var cameraId: NSString?
  @objc var enableDepthData = false
  @objc var enableHighQualityPhotos = false
  @objc var enablePortraitEffectsMatteDelivery = false
  @objc var enableBufferCompression = false
  // use cases
  @objc var photo = false
  @objc var video = false
  @objc var audio = false
  @objc var enableFrameProcessor = false
  @objc var codeScannerOptions: NSDictionary?
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
  @objc var resizeMode: NSString = "cover" {
    didSet {
      previewView.resizeMode = ResizeMode(fromTypeScriptUnion: resizeMode as String)
    }
  }

  // events
  @objc var onInitialized: RCTDirectEventBlock?
  @objc var onError: RCTDirectEventBlock?
  @objc var onViewReady: RCTDirectEventBlock?
  @objc var onCodeScanned: RCTDirectEventBlock?
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
  var cameraSession: CameraSession
  var isMounted = false
  var isReady = false
  #if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
    @objc public var frameProcessor: FrameProcessor?
  #endif
  // CameraView+Zoom
  var pinchGestureRecognizer: UIPinchGestureRecognizer?
  var pinchScaleOffset: CGFloat = 1.0

  var previewView: PreviewView
  #if DEBUG
    var fpsGraph: RCTFPSGraph?
  #endif

  /// Returns whether the AVCaptureSession is currently running (reflected by isActive)
  var isRunning: Bool {
    return captureSession.isRunning
  }

  // pragma MARK: Setup
  override public init(frame: CGRect) {
    // Create CameraSession
    cameraSession = CameraSession(onError: { error in
      self.invokeOnError(error)
    }, onInitialized: {
      self.invokeOnInitialized()
    })
    previewView = cameraSession.createPreviewView(frame: frame)
    super.init(frame: frame)

    addSubview(previewView)
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) is not implemented.")
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
    previewView.frame = frame
    previewView.bounds = bounds
  }
  
  func getPixelFormat() -> PixelFormat {
    // TODO: Use ObjC RCT enum parser for this
    if let pixelFormat = self.pixelFormat as? String {
      do {
        return try PixelFormat(unionValue: pixelFormat)
      } catch (let error) {
        if let error = error as? CameraError {
          invokeOnError(error)
        } else {
          invokeOnError(.unknown(message: error.localizedDescription, cause: error as NSError))
        }
      }
    }
    return .native
  }

  // pragma MARK: Props updating
  override public final func didSetProps(_ changedProps: [String]!) {
    ReactLogger.log(level: .info, message: "Updating \(changedProps.count) props: [\(changedProps.joined(separator: ", "))]")
    
    cameraSession.configure { config in
      config.cameraId = cameraId as? String
      
      // Photo
      if photo {
        config.photo = .enabled(config: CameraConfiguration.Photo(enableHighQualityPhotos: enableHighQualityPhotos,
                                                                  enableDepthData: enableDepthData,
                                                                  enablePortraitEffectsMatte: enablePortraitEffectsMatteDelivery))
      }
      // Video/Frame Processor
      if video || enableFrameProcessor {
        config.video = .enabled(config: CameraConfiguration.Video(pixelFormat: getPixelFormat(),
                                                                  enableBufferCompression: enableBufferCompression,
                                                                  enableHdr: hdr?.boolValue == true,
                                                                  enableFrameProcessor: enableFrameProcessor))
      }
    }
    
    // Store `zoom` offset for native pinch-gesture
    if changedProps.contains("zoom") {
      self.pinchScaleOffset = zoom.doubleValue
    }
    
    // Set up Debug FPS Graph
    if changedProps.contains("enableFpsGraph") {
      DispatchQueue.main.async {
        self.setupFpsGraph()
      }
    }
  }

  func setupFpsGraph() {
    #if DEBUG
      if enableFpsGraph {
        if fpsGraph != nil { return }
        fpsGraph = RCTFPSGraph(frame: CGRect(x: 10, y: 54, width: 75, height: 45), color: .red)
        fpsGraph!.layer.zPosition = 9999.0
        addSubview(fpsGraph!)
      } else {
        fpsGraph?.removeFromSuperview()
        fpsGraph = nil
      }
    #endif
  }

  // pragma MARK: Event Invokers
  final func invokeOnError(_ error: CameraError, cause: NSError? = nil) {
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

  final func invokeOnInitialized() {
    ReactLogger.log(level: .info, message: "Camera initialized!")
    guard let onInitialized = onInitialized else { return }
    onInitialized([String: Any]())
  }
}
