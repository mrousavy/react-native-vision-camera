///
/// AV+TargetColorSpace.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension TargetColorSpace {
  func toAVCaptureColorSpace() -> AVCaptureColorSpace {
    switch self {
    case .srgb:
      return .sRGB
    case .p3D65:
      return .P3_D65
    case .hlgBt2020:
      return .HLG_BT2020
    case .appleLog:
      if #available(iOS 17.0, *) {
        return .appleLog
      } else {
        return .HLG_BT2020
      }
    case .appleLog2:
      if #available(iOS 26.0, *) {
        return .appleLog2
      } else if #available(iOS 17.0, *) {
        return .appleLog
      } else {
        return .HLG_BT2020
      }
    case .dolbyVision:
      // Dolby Vision is not supported on iOS
      return .HLG_BT2020
    }
  }
}
