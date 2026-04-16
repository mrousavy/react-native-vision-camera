///
/// AV+ColorSpace.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension ColorSpace {
  init(colorSpace: AVCaptureColorSpace) {
    switch colorSpace {
    case .sRGB:
      self = .srgb
    case .P3_D65:
      self = .p3D65
    case .HLG_BT2020:
      self = .hlgBt2020
    case .appleLog:
      self = .appleLog
    case .appleLog2:
      self = .appleLog2
    @unknown default:
      self = .unknown
    }
  }
}
