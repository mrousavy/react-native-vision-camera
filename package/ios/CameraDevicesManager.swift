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
class CameraDevicesManager: RCTEventEmitter {
  private let discoverySession = AVCaptureDevice.DiscoverySession(deviceTypes: getAllDeviceTypes(),
                                                                  mediaType: .video,
                                                                  position: .unspecified)
  private var observer: NSKeyValueObservation?
  private let devicesChangedEventName = "CameraDevicesChanged"

  override init() {
    super.init()
    observer = discoverySession.observe(\.devices) { _, _ in
      self.sendEvent(withName: self.devicesChangedEventName, body: self.getDevicesJson())
    }
  }

  override func invalidate() {
    observer?.invalidate()
  }

  override func supportedEvents() -> [String]! {
    return [devicesChangedEventName]
  }

  override class func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func constantsToExport() -> [AnyHashable: Any]! {
    let devices = getDevicesJson()
    let preferredDevice = getPreferredDevice()

    return [
      "availableCameraDevices": devices,
      "userPreferredCameraDevice": preferredDevice?.toDictionary() as Any,
    ]
  }

  private func getDevicesJson() -> [[String: Any]] {
    return discoverySession.devices.map {
      return $0.toDictionary()
    }
  }

  private func getPreferredDevice() -> AVCaptureDevice? {
    #if swift(>=5.9)
      if #available(iOS 17.0, *) {
        if let userPreferred = AVCaptureDevice.userPreferredCamera {
          // Return the device that was explicitly marked as a preferred camera by the user
          return userPreferred
        }
      }
    #endif
    // Just return the first device
    return discoverySession.devices.first
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

    // iOS 17 specifics:
    //  This is only reported if `NSCameraUseExternalDeviceType` is set to true in Info.plist,
    //  otherwise external devices are just reported as wide-angle-cameras
    // deviceTypes.append(.external)
    //  This is only reported if `NSCameraUseContinuityCameraDeviceType` is set to true in Info.plist,
    //  otherwise continuity camera devices are just reported as wide-angle-cameras
    // deviceTypes.append(.continuityCamera)

    return deviceTypes
  }
}
