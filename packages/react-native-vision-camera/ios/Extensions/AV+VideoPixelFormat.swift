///
/// AutoFocusSystem+VideoPixelFormat.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension VideoPixelFormat {
  init(osType: OSType) {
    switch osType {
    case kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange:
      self = .yuv4208BitVideo
    case kCVPixelFormatType_420YpCbCr8BiPlanarFullRange:
      self = .yuv4208BitFull
    case kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange:
      self = .yuv42010BitVideo
    case kCVPixelFormatType_420YpCbCr10BiPlanarFullRange:
      self = .yuv42010BitFull
    case kCVPixelFormatType_32BGRA:
      self = .rgbBgra32Bit
    default:
      self = .unknown
    }
  }
}
