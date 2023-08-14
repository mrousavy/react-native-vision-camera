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
final public class CameraViewManager: RCTViewManager {
  // pragma MARK: Properties

  override public var methodQueue: DispatchQueue! {
    return DispatchQueue.main
  }

  override public static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override public final func view() -> UIView! {
    return CameraView()
  }

  // pragma MARK: React Functions

  @objc
    static public func startRecording(options: NSDictionary, onRecordCallback: @escaping RCTResponseSenderBlock, view: CameraView) {

    view.startRecording(options: options, callback: onRecordCallback)
  }

  @objc
    static public func pauseRecording( resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock, view: CameraView) {

        view.pauseRecording(promise: Promise(resolver: resolve, rejecter: reject))
  }

  @objc
    static public func resumeRecording( resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock, view: CameraView) {

        view.resumeRecording(promise: Promise(resolver: resolve, rejecter: reject))
  }

  @objc
    static public func stopRecording( resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock, view: CameraView) {

        view.stopRecording(promise: Promise(resolver: resolve, rejecter: reject))
  }

  @objc
  static public func takePhoto( options: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock, view: CameraView) {

      view.takePhoto(options: options, promise: Promise(resolver: resolve, rejecter: reject))
  }

  @objc
    static public func focus( point: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock, view: CameraView) {
    let promise = Promise(resolver: resolve, rejecter: reject)
    guard let x = point["x"] as? NSNumber, let y = point["y"] as? NSNumber else {
      promise.reject(error: .parameter(.invalid(unionName: "point", receivedValue: point.description)))
      return
    }

        view.focus(point: CGPoint(x: x.doubleValue, y: y.doubleValue), promise: promise)
  }

  @objc
  static public func getAvailableVideoCodecs( fileType: String?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock, view: CameraView) {
    withPromise(resolve: resolve, reject: reject) {
      guard let videoOutput = view.videoOutput else {
        throw CameraError.session(SessionError.cameraNotReady)
      }

      var parsedFileType = AVFileType.mov
      if fileType != nil {
        guard let parsed = try? AVFileType(withString: fileType!) else {
          throw CameraError.parameter(ParameterError.invalid(unionName: "fileType", receivedValue: fileType!))
        }
        parsedFileType = parsed
      }

      return videoOutput.availableVideoCodecTypesForAssetWriter(writingTo: parsedFileType).map(\.descriptor)
    }
  }

  @objc
static public func getAvailableCameraDevices(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
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
  static public func getCameraPermissionStatus(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let status = AVCaptureDevice.authorizationStatus(for: .video)
      return status.descriptor
    }
  }

  @objc
  static public func getMicrophonePermissionStatus(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let status = AVCaptureDevice.authorizationStatus(for: .audio)
      return status.descriptor
    }
  }

  @objc
  static public func requestCameraPermission(_ resolve: @escaping RCTPromiseResolveBlock, reject _: @escaping RCTPromiseRejectBlock) {
    AVCaptureDevice.requestAccess(for: .video) { granted in
      let result: AVAuthorizationStatus = granted ? .authorized : .denied
      resolve(result.descriptor)
    }
  }

  @objc
  static public func requestMicrophonePermission(_ resolve: @escaping RCTPromiseResolveBlock, reject _: @escaping RCTPromiseRejectBlock) {
    AVCaptureDevice.requestAccess(for: .audio) { granted in
      let result: AVAuthorizationStatus = granted ? .authorized : .denied
      resolve(result.descriptor)
    }
  }

  // MARK: Private

//  private static func getCameraView(withTag tag: NSNumber) -> CameraView {
    // swiftlint:disable force_cast
//      return bridge.uiManager.view(forReactTag: tag) as! CameraView
//  }

  private static func getAllDeviceTypes() -> [AVCaptureDevice.DeviceType] {
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
