///
/// AV+VideoPixelFormat.swift
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
  
  func toCVPixelFormatType() throws -> OSType {
    switch self {
    case .yuv4208BitVideo:
      return kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange
    case .yuv4208BitFull:
      return kCVPixelFormatType_420YpCbCr8BiPlanarFullRange
    case .yuv42010BitVideo:
      return kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange
    case .yuv42010BitFull:
      return kCVPixelFormatType_420YpCbCr10BiPlanarFullRange
    case .yuv42210BitVideo:
      return kCVPixelFormatType_422YpCbCr10BiPlanarVideoRange
    case .yuv42210BitFull:
      return kCVPixelFormatType_422YpCbCr10BiPlanarFullRange
    case .rgbBgra32Bit:
      return kCVPixelFormatType_32BGRA
    case .unknown:
      throw RuntimeError.error(withMessage: "Cannot convert \"unknown\" VideoPixelFormat to CVPixelFormat!")
    }
  }
  
  func toCMMediaSubType() throws -> CMFormatDescription.MediaSubType {
    let cvPixelFormat = try toCVPixelFormatType()
    return CMFormatDescription.MediaSubType(rawValue: cvPixelFormat)
  }
}
