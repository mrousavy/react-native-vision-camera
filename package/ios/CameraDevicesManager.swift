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
    return [
      "availableCameraDevices": getDevicesJson(),
    ]
  }

  private func getDevicesJson() -> [[String: Any]] {
    return discoverySession.devices.map {
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
        "supportsDepthCapture": false, // TODO: supportsDepthCapture
        "supportsRawCapture": false, // TODO: supportsRawCapture
        "supportsLowLightBoost": $0.isLowLightBoostSupported,
        "supportsFocus": $0.isFocusPointOfInterestSupported,
        "hardwareLevel": "full",
        "sensorOrientation": "portrait", // TODO: Sensor Orientation?
        "formats": $0.formats.map { format -> [String: Any] in
          format.toDictionary()
        },
      ]
    }
  }

  private static func getAllDeviceTypes() -> [AVCaptureDevice.DeviceType] {
    var deviceTypes: [AVCaptureDevice.DeviceType] = []
    if #available(iOS 13.0, *) {
      deviceTypes.append(.builtInTripleCamera)
      deviceTypes.append(.builtInDualWideCamera)
      deviceTypes.append(.builtInUltraWideCamera)
    }
    deviceTypes.append(.builtInDualCamera)
    deviceTypes.append(.builtInWideAngleCamera)
    deviceTypes.append(.builtInTelephotoCamera)
    return deviceTypes
  }
}
