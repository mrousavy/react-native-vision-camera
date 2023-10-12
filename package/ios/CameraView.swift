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

// TODOs for the CameraView which are currently too hard to implement either because of AVFoundation's limitations, or my brain capacity
//
// CameraView+RecordVideo
// TODO: Better startRecording()/stopRecording() (promise + callback, wait for TurboModules/JSI)
//
// CameraView+TakePhoto
// TODO: Photo HDR

// MARK: - CameraView

public final class CameraView: UIView, CameraSessionDelegate {
  
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
  @objc var hdr: Bool = false
  @objc var lowLightBoost: Bool = false
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

  // pragma MARK: Setup

  override public init(frame: CGRect) {
    // Create CameraSession
    cameraSession = CameraSession()
    previewView = cameraSession.createPreviewView(frame: frame)
    super.init(frame: frame)
    cameraSession.delegate = self

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
    if let pixelFormat = pixelFormat as? String {
      do {
        return try PixelFormat(unionValue: pixelFormat)
      } catch {
        if let error = error as? CameraError {
          onError(error)
        } else {
          onError(.unknown(message: error.localizedDescription, cause: error as NSError))
        }
      }
    }
    return .native
  }
  
  func getTorch() -> Torch {
    // TODO: Use ObjC RCT enum parser for this
    if let torch = try? Torch(fromTypeScriptUnion: torch) {
      return torch
    }
    return .off
  }

  // pragma MARK: Props updating
  override public final func didSetProps(_ changedProps: [String]!) {
    ReactLogger.log(level: .info, message: "Updating \(changedProps.count) props: [\(changedProps.joined(separator: ", "))]")

    cameraSession.configure { config in
      // Input Camera Device
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
                                                                  enableHdr: hdr,
                                                                  enableFrameProcessor: enableFrameProcessor))
      }
      
      // Audio
      if audio {
        config.audio = .enabled(config: CameraConfiguration.Audio())
      }
      
      // Code Scanner
      if let codeScannerOptions {
        let codeScanner = try CodeScanner(fromJsValue: codeScannerOptions)
        config.codeScanner = .enabled(config: codeScanner)
      }

      // Orientation
      if let jsOrientation = orientation as? String {
        let orientation = try Orientation(fromTypeScriptUnion: jsOrientation)
        config.orientation = orientation
      }

      // Format
      config.format = format

      // Side-Props
      config.fps = fps?.int32Value
      config.enableLowLightBoost = lowLightBoost
      config.torch = getTorch()

      // Zoom
      config.zoom = zoom.doubleValue

      // isActive
      config.isActive = isActive
    }

    // Store `zoom` offset for native pinch-gesture
    if changedProps.contains("zoom") {
      pinchScaleOffset = zoom.doubleValue
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
  
  func onError(_ error: CameraError) {
    ReactLogger.log(level: .error, message: "Invoking onError(): \(error.message)")
    guard let onError = onError else {
      return
    }

    var causeDictionary: [String: Any]?
    if case let .unknown(_, cause) = error,
       let cause = cause {
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
  
  func onSessionInitialized() {
    ReactLogger.log(level: .info, message: "Camera initialized!")
    guard let onInitialized = onInitialized else {
      return
    }
    onInitialized([String: Any]())
  }
  
  func onTick() {
    #if DEBUG
    if let fpsGraph {
      fpsGraph.onTick(CACurrentMediaTime())
    }
    #endif
  }

  func onCodeScanned(codes: [CameraSession.Code]) {
    guard let onCodeScanned = onCodeScanned else {
      return
    }
    onCodeScanned([
      "codes": codes.map({ $0.toJSValue() })
    ])
  }
}
