//
//  AVCaptureDevice.DeviceType+physicalDeviceDescriptor.swift
//  mrousavy
//
//  Created by Marc Rousavy on 15.12.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension AVCaptureDevice.DeviceType {
  /**
   Gets a descriptor if this is a physical device (wide, ultra-wide and telephoto), or "unknown-camera" otherwise (TrueDepth, LiDAR, InfraRed, USB, ..)
   */
  var physicalDeviceDescriptor: String {
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
      // e.g. Infra-Red, LiDAR, Depth Data, USB or Continuity Camera Devices
      VisionLogger.log(level: .error, message: "Unknown AVCaptureDevice.DeviceType (\(rawValue))! Falling back to wide-angle-camera..")
      return "wide-angle-camera"
    }
  }
}
