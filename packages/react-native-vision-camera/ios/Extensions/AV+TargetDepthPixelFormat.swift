///
/// AutoFocusSystem+TargetDepthPixelFormat.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension TargetDepthPixelFormat {
  func toCVPixelFormatType() -> TargetCVPixelFormat {
    switch self {
    case .native:
      return .native
    case .depth16Bit:
      return .specific(kCVPixelFormatType_DepthFloat16)
    case .depth32Bit:
      return .specific(kCVPixelFormatType_DepthFloat32)
    case .disparity16Bit:
      return .specific(kCVPixelFormatType_DisparityFloat16)
    case .disparity32Bit:
      return .specific(kCVPixelFormatType_DisparityFloat32)
    }
  }
}
