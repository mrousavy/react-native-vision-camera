//
//  CameraViewManager.swift
//  mrousavy
//
//  Created by Marc Rousavy on 09.11.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

@objc(CameraViewManager)
final class CameraViewManager: RCTViewManager {
  // pragma MARK: Properties

  private var runtimeManager: FrameProcessorRuntimeManager?

  override var bridge: RCTBridge! {
    didSet {
      // Install Frame Processor bindings and setup Runtime
      if VISION_CAMERA_ENABLE_FRAME_PROCESSORS {
        CameraQueues.frameProcessorQueue.async {
          self.runtimeManager = FrameProcessorRuntimeManager(bridge: self.bridge)
          self.bridge.runOnJS {
            self.runtimeManager!.installFrameProcessorBindings()
          }
        }
      }
    }
  }

  override var methodQueue: DispatchQueue! {
    return DispatchQueue.main
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override final func view() -> UIView! {
    return CameraView()
  }

  // pragma MARK: React Functions

  @objc
  final func startRecording(_ nativeID: String, options: NSDictionary, onRecordCallback: @escaping RCTResponseSenderBlock) {
    let callback = Callback(onRecordCallback)
    do {
      let camera = try getCameraView(withNativeId: nativeID)
      // TODO: Make startRecording() async to allow awaiting it with TurboModules
      camera.startRecording(options: options, callback: callback)
    } catch {
      let cameraError = error as? CameraError ?? .unknown(message: "Failed to find Camera View with nativeID \"\(nativeID)\"")
      callback.reject(error: cameraError)
    }
  }

  @objc
  final func stopRecording(_ nativeID: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let promise = Promise(resolver: resolve, rejecter: reject)
    do {
      let camera = try getCameraView(withNativeId: nativeID)
      // TODO: Make stopRecording() async to get rid of passing promise in here
      camera.stopRecording(promise: Promise(resolver: resolve, rejecter: reject))
    } catch {
      let cameraError = error as? CameraError ?? .unknown(message: "Failed to find Camera View with nativeID \"\(nativeID)\"")
      promise.reject(error: cameraError)
    }
  }

  @objc
  final func takePhoto(_ nativeID: String, options: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let promise = Promise(resolver: resolve, rejecter: reject)
    do {
      let camera = try getCameraView(withNativeId: nativeID)
      // TODO: Make takePhoto() async to get rid of passing promise in here
      camera.takePhoto(options: options, promise: promise)
    } catch {
      let cameraError = error as? CameraError ?? .unknown(message: "Failed to find Camera View with nativeID \"\(nativeID)\"")
      promise.reject(error: cameraError)
    }
  }

  @objc
  final func focus(_ nativeID: String, point: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      guard let x = point["x"] as? NSNumber, let y = point["y"] as? NSNumber else {
        throw CameraError.parameter(.invalid(unionName: "point", receivedValue: point.description))
      }
      let camera = try getCameraView(withNativeId: nativeID)
      try camera.focus(point: CGPoint(x: x.doubleValue, y: y.doubleValue))
      return nil
    }
  }

  @objc
  final func getAvailableCameraDevices(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let discoverySession = AVCaptureDevice.DiscoverySession(deviceTypes: getAllDeviceTypes(), mediaType: .video, position: .unspecified)
      let devices = discoverySession.devices.filter {
        if #available(iOS 11.1, *) {
          // exclude the true-depth camera. The True-Depth camera has YUV and Infrared, can't take photos!
          return $0.deviceType != .builtInTrueDepthCamera
        }
        return true
      }
      return devices.map {
        return [
          "id": $0.uniqueID,
          "devices": $0.physicalDevices.map(\.deviceType.descriptor),
          "position": $0.position.descriptor,
          "name": $0.localizedName,
          "hasFlash": $0.hasFlash,
          "hasTorch": $0.hasTorch,
          "minZoom": $0.minAvailableVideoZoomFactor,
          "neutralZoom": $0.neutralZoomFactor,
          "maxZoom": $0.maxAvailableVideoZoomFactor,
          "isMultiCam": $0.isMultiCam,
          "supportsParallelVideoProcessing": true,
          "supportsDepthCapture": false, // TODO: supportsDepthCapture
          "supportsRawCapture": false, // TODO: supportsRawCapture
          "supportsLowLightBoost": $0.isLowLightBoostSupported,
          "supportsFocus": $0.isFocusPointOfInterestSupported,
          "formats": $0.formats.map { format -> [String: Any] in
            format.toDictionary()
          },
        ]
      }
    }
  }

  @objc
  final func getCameraPermissionStatus(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let status = AVCaptureDevice.authorizationStatus(for: .video)
      return status.descriptor
    }
  }

  @objc
  final func getMicrophonePermissionStatus(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let status = AVCaptureDevice.authorizationStatus(for: .audio)
      return status.descriptor
    }
  }

  @objc
  final func requestCameraPermission(_ resolve: @escaping RCTPromiseResolveBlock, reject _: @escaping RCTPromiseRejectBlock) {
    AVCaptureDevice.requestAccess(for: .video) { granted in
      let result: AVAuthorizationStatus = granted ? .authorized : .denied
      resolve(result.descriptor)
    }
  }

  @objc
  final func requestMicrophonePermission(_ resolve: @escaping RCTPromiseResolveBlock, reject _: @escaping RCTPromiseRejectBlock) {
    AVCaptureDevice.requestAccess(for: .audio) { granted in
      let result: AVAuthorizationStatus = granted ? .authorized : .denied
      resolve(result.descriptor)
    }
  }

  // MARK: Private

  private func getCameraView(withNativeId nativeID: String) throws -> CameraView {
    guard let window = UIApplication.shared.keyWindow else {
      throw CameraError.unknown(message: "Failed to find Camera View - Could not find root window!")
    }
    guard let view = bridge.uiManager.view(forNativeID: nativeID,
                                           withRootTag: window.reactTag) else {
      throw CameraError.system(.viewNotFound(nativeID: nativeID))
    }
    guard let cameraView = view as? CameraView else {
      throw CameraError.unknown(message: "Failed to find Camera View - View with nativeID \"\(nativeID)\" " +
        "is a different kind of View! Did you pass the same \"nativeID\" to multiple views?")
    }
    return cameraView
  }

  private final func getAllDeviceTypes() -> [AVCaptureDevice.DeviceType] {
    var deviceTypes: [AVCaptureDevice.DeviceType] = []
    if #available(iOS 13.0, *) {
      deviceTypes.append(.builtInTripleCamera)
      deviceTypes.append(.builtInDualWideCamera)
      deviceTypes.append(.builtInUltraWideCamera)
    }
    if #available(iOS 11.1, *) {
      deviceTypes.append(.builtInTrueDepthCamera)
    }
    deviceTypes.append(.builtInDualCamera)
    deviceTypes.append(.builtInWideAngleCamera)
    deviceTypes.append(.builtInTelephotoCamera)
    return deviceTypes
  }
}
