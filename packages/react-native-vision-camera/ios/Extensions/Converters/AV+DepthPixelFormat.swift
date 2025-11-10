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
  
  func toCVPixelFormatType() throws -> OSType {
    switch self {
    case .unknown:
      throw RuntimeError.error(withMessage: "Cannot convert DepthPixelFormat \"unknown\" to native OSType!")
    case .depth16Bit:
      return kCVPixelFormatType_DepthFloat16
    case .depth32Bit:
      return kCVPixelFormatType_DepthFloat32
    case .disparity16Bit:
      return kCVPixelFormatType_DisparityFloat16
    case .disparity32Bit:
      return kCVPixelFormatType_DisparityFloat32
    }
  }
  
  func toCMMediaSubType() throws -> CMFormatDescription.MediaSubType {
    let cvPixelFormat = try toCVPixelFormatType()
    return CMFormatDescription.MediaSubType(rawValue: cvPixelFormat)
  }
}
