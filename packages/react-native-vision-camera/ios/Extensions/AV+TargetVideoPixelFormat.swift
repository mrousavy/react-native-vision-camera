///
/// AutoFocusSystem+TargetVideoPixelFormat.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension TargetVideoPixelFormat {
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
    case .yuv42210BitVideo:
      return .specific(kCVPixelFormatType_422YpCbCr10BiPlanarVideoRange)
    case .yuv42210BitFull:
      return .specific(kCVPixelFormatType_422YpCbCr10BiPlanarFullRange)
    case .rgbBgra32Bit:
      return .specific(kCVPixelFormatType_32BGRA)
    }
  }
}
