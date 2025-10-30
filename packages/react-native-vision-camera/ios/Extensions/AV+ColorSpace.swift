///
/// ColorSpace+toAVColorSpace.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension ColorSpace {
  init(color: AVCaptureColorSpace) {
    switch color {
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
      self = .srgb
    }
  }

  func toAVColorSpace() -> AVCaptureColorSpace {
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
        return .sRGB
      }
    case .appleLog2:
      if #available(iOS 26.0, *) {
        return .appleLog2
      } else {
        return .sRGB
      }
    }
  }
}
