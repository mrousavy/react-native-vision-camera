//
//  CameraDevicesManager.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 19.09.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

@objc(CameraDevicesManager)
final class CameraDevicesManager: RCTEventEmitter {
  private let discoverySession = AVCaptureDevice.DiscoverySession(deviceTypes: getAllDeviceTypes(),
                                                                  mediaType: .video,
                                                                  position: .unspecified)
  private var observer: NSKeyValueObservation?
  private let devicesChangedEventName = "CameraDevicesChanged"

  override init() {
    super.init()
    observer = discoverySession.observe(\.devices) { _, _ in
      let devices = self.getDevicesJson()
      VisionLogger.log(level: .info, message: "Camera Devices changed - found \(devices.count) Camera Devices.")

      self.sendEvent(withName: self.devicesChangedEventName,
                     body: devices)
    }
  }

  override func invalidate() {
    observer?.invalidate()
  }

  override func supportedEvents() -> [String]! {
    return [devicesChangedEventName]
  }

  override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func constantsToExport() -> [AnyHashable: Any]! {
    let devices = getDevicesJson()
    let preferredDevice = getPreferredDeviceJson()
    VisionLogger.log(level: .info, message: "Found \(devices.count) initial Camera Devices.")

    return [
      "availableCameraDevices": devices,
      "userPreferredCameraDevice": preferredDevice as Any,
    ]
  }

  private func getDevicesJson() -> [[String: Any]] {
    return discoverySession.devices.map {
      return $0.toDictionary()
    }
  }

  private func getPreferredDeviceJson() -> [String: Any]? {
    let preferredDevice = getPreferredDevice()
    return preferredDevice?.toDictionary()
  }

  private func getPreferredDevice() -> AVCaptureDevice? {
    if #available(iOS 17.0, *) {
      if let userPreferred = AVCaptureDevice.userPreferredCamera {
        guard !userPreferred.uniqueID.isEmpty else {
          // Due to an iOS 17 bug, Simulators return a non-nil AVCaptureDevice here,
          // but all properties on this AVCaptureDevice are 0x0/empty/invalid.
          // So we catch this bug and return a nil preferred device here.
          return nil
        }
        // Return the device that was explicitly marked as a preferred camera by the user
        return userPreferred
      }
    }
    // Usually prefer the wide angle back camera
    if let defaultBackWideAngle = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) {
      return defaultBackWideAngle
    }
    // Fall back to the default video
    if let defaultVideo = AVCaptureDevice.default(for: .video) {
      return defaultVideo
    }
    // Return nil because apparently we couldn't find a default
    return nil
  }

  private static func getAllDeviceTypes() -> [AVCaptureDevice.DeviceType] {
    var deviceTypes: [AVCaptureDevice.DeviceType] = []
    deviceTypes.append(.builtInDualCamera)
    deviceTypes.append(.builtInWideAngleCamera)
    deviceTypes.append(.builtInTelephotoCamera)
    deviceTypes.append(.builtInTrueDepthCamera)
    if #available(iOS 13.0, *) {
      deviceTypes.append(.builtInTripleCamera)
      deviceTypes.append(.builtInDualWideCamera)
      deviceTypes.append(.builtInUltraWideCamera)
    }
    if #available(iOS 15.4, *) {
      deviceTypes.append(.builtInLiDARDepthCamera)
    }

    if #available(iOS 17.0, *) {
      // This is only reported if `NSCameraUseExternalDeviceType` is set to true in Info.plist,
      // otherwise external devices are just reported as wide-angle-cameras
      deviceTypes.append(.external)
      // This is only reported if `NSCameraUseContinuityCameraDeviceType` is set to true in Info.plist,
      // otherwise continuity camera devices are just reported as wide-angle-cameras
      deviceTypes.append(.continuityCamera)
    }

    return deviceTypes
  }
}
