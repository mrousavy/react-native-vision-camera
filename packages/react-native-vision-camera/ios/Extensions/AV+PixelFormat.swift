///
/// AutoFocusSystem+PixelFormat.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension PixelFormat {
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
    case kCVPixelFormatType_DepthFloat16:
      self = .depth32Bit
    case kCVPixelFormatType_DepthFloat32:
      self = .depth32Bit
    case kCVPixelFormatType_DisparityFloat16:
      self = .disparity16Bit
    case kCVPixelFormatType_DisparityFloat32:
      self = .disparity32Bit
    default:
      self = .unknown
    }
  }
}
