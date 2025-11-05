///
/// AutoFocusSystem+TargetPixelFormat.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

enum TargetCVPixelFormat {
  case native
  case specific(OSType)
}

extension TargetPixelFormat {
  func toCVPixelFormatType() -> TargetCVPixelFormat {
    switch self {
    case .native:
      return .native
    case .yuv4208BitVideo:
      return .specific(kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange)
    case .yuv4208BitFull:
      return .specific(kCVPixelFormatType_420YpCbCr8BiPlanarFullRange)
    case .yuv42010BitVideo:
      return .specific(kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange)
    case .yuv42010BitFull:
      return .specific(kCVPixelFormatType_420YpCbCr10BiPlanarFullRange)
    case .rgbBgra32Bit:
      return .specific(kCVPixelFormatType_32BGRA)
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
