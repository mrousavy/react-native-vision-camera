//
//  PixelFormat.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 17.08.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

enum PixelFormat {
  case yuv
  case rgb
  case dng
  case native
  case unknown

  var unionValue: String {
    switch self {
    case .yuv:
      return "yuv"
    case .rgb:
      return "rgb"
    case .dng:
      return "dng"
    case .native:
      return "native"
    case .unknown:
      return "unknown"
    }
  }

  init(unionValue: String) throws {
    switch unionValue {
    case "yuv":
      self = .yuv
    case "rgb":
      self = .rgb
    case "dng":
      self = .dng
    case "native":
      self = .native
    case "unknown":
      self = .unknown
    default:
      throw CameraError.parameter(.invalid(unionName: "pixelFormat", receivedValue: unionValue))
    }
  }

  init(mediaSubType: OSType) {
    switch mediaSubType {
    case kCVPixelFormatType_420YpCbCr8BiPlanarFullRange,
         kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange,
         kCVPixelFormatType_420YpCbCr10BiPlanarFullRange,
         kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange,
         kCVPixelFormatType_Lossless_420YpCbCr8BiPlanarFullRange,
         kCVPixelFormatType_Lossless_420YpCbCr8BiPlanarVideoRange,
         kCVPixelFormatType_Lossless_420YpCbCr10PackedBiPlanarVideoRange:
      self = .yuv
    case kCVPixelFormatType_32BGRA, kCVPixelFormatType_Lossless_32BGRA:
      self = .rgb
    default:
      self = .unknown
    }
  }
}
