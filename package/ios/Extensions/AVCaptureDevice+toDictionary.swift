//
//  AVCaptureDevice+toDictionary.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 21.09.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation

extension AVCaptureDevice {
  func toDictionary() -> [String: Any] {
    return [
      "id": uniqueID,
      "physicalDevices": physicalDevices.map(\.deviceType.physicalDeviceDescriptor),
      "position": position.descriptor,
      "name": localizedName,
      "hasFlash": hasFlash,
      "hasTorch": hasTorch,
      "minZoom": minAvailableVideoZoomFactor,
      "neutralZoom": neutralZoomFactor,
      "maxZoom": maxAvailableVideoZoomFactor,
      "isMultiCam": isMultiCam,
      "supportsRawCapture": false, // TODO: supportsRawCapture
      "supportsLowLightBoost": isLowLightBoostSupported,
      "supportsFocus": isFocusPointOfInterestSupported,
      "hardwareLevel": "full",
      "sensorOrientation": "portrait", // TODO: Sensor Orientation?
      "formats": formats.map { format -> [String: Any] in
        format.toDictionary()
      },
    ]
  }
}
