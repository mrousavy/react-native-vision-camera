//
//  AVCaptureDevice.DeviceType+descriptor.swift
//  mrousavy
//
//  Created by Marc Rousavy on 15.12.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension AVCaptureDevice.DeviceType {
  var descriptor: String {
    if #available(iOS 13.0, *) {
      if self == .builtInUltraWideCamera {
        return "ultra-wide-angle-camera"
      }
    }
    switch self {
    case .builtInTelephotoCamera:
      return "telephoto-camera"
    case .builtInWideAngleCamera:
      return "wide-angle-camera"
    default:
      // e.g. `.builtInTrueDepthCamera`
      ReactLogger.log(level: .error, message: "Unknown AVCaptureDevice.DeviceType (\(self.rawValue))! Falling back to wide-angle-camera..")
      return "wide-angle-camera"
    }
  }
}
