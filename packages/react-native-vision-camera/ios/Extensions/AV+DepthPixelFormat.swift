///
/// AutoFocusSystem+DepthPixelFormat.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension DepthPixelFormat {
  init(osType: OSType) {
    switch osType {
    case kCVPixelFormatType_DepthFloat16:
      self = .depth16Bit
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
