//
//  AVCaptureDevice+toDictionary.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 19.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import AVFoundation

extension AVCaptureDevice {
  func toDictionary() -> [String: Any] {
    return [
      "id": self.uniqueID,
      "devices": self.physicalDevices.map(\.deviceType.descriptor),
      "position": self.position.descriptor,
      "name": self.localizedName,
      "hasFlash": self.hasFlash,
      "hasTorch": self.hasTorch,
      "minZoom": self.minAvailableVideoZoomFactor,
      "maxZoom": self.maxAvailableVideoZoomFactor,
      "neutralZoom": self.neutralZoomPercent,
      "isMultiCam": self.isMultiCam,
      "supportsDepthCapture": false, // TODO: supportsDepthCapture
      "supportsRawCapture": false, // TODO: supportsRawCapture
      "supportsLowLightBoost": self.isLowLightBoostSupported,
      "supportsFocus": self.isFocusPointOfInterestSupported,
      "formats": self.formats.map { (format) -> [String: Any] in
        format.toDictionary()
      },
    ]
  }
}
