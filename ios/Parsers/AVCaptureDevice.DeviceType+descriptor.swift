//
//  AVCaptureDevice.DeviceType+descriptor.swift
//  Cuvent
//
//  Created by Marc Rousavy on 15.12.20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import AVFoundation
import Foundation

extension AVCaptureDevice.DeviceType {
  var descriptor: String {
    if #available(iOS 13.0, *) {
      switch self {
      case .builtInDualWideCamera:
        return "dual-wide-camera"
      case .builtInTripleCamera:
        return "triple-camera"
      case .builtInUltraWideCamera:
        return "ultra-wide-angle-camera"
      default:
        break
      }
    }
    if #available(iOS 11.1, *) {
      switch self {
      case .builtInTrueDepthCamera:
        return "true-depth-camera"
      default:
        break
      }
    }
    switch self {
    case .builtInDualCamera:
      return "dual-camera"
    case .builtInTelephotoCamera:
      return "telephoto-camera"
    case .builtInWideAngleCamera:
      return "wide-angle-camera"
    default:
      fatalError("AVCaptureDevice.Position has unknown state.")
    }
  }
}
