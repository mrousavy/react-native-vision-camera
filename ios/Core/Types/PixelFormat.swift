//
//  PixelFormat.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 17.08.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

@frozen
enum PixelFormat: String, JSUnionValue {
  case yuv
  case rgb
  case unknown

  init(jsValue: String) throws {
    if let parsed = PixelFormat(rawValue: jsValue) {
      self = parsed
    } else {
      throw CameraError.parameter(.invalid(unionName: "pixelFormat", receivedValue: jsValue))
    }
  }

  var jsValue: String {
    return rawValue
  }

  init(mediaSubType: OSType) {
    switch mediaSubType {
    case kCVPixelFormatType_420YpCbCr8BiPlanarFullRange,
         kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange,
         kCVPixelFormatType_420YpCbCr10BiPlanarFullRange,
         kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange,
         kCVPixelFormatType_Lossy_420YpCbCr8BiPlanarFullRange,
         kCVPixelFormatType_Lossy_420YpCbCr8BiPlanarVideoRange,
         kCVPixelFormatType_Lossy_420YpCbCr10PackedBiPlanarVideoRange:
      self = .yuv
    case kCVPixelFormatType_32BGRA, kCVPixelFormatType_Lossy_32BGRA:
      self = .rgb
    default:
      self = .unknown
    }
  }
}
