//
//  OSType+descriptor.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 02.05.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation
import CoreVideo

func parsePixelBufferFormat(_ string: String) throws -> OSType {
  switch (string) {
  case "420v":
    return kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange
  case "420f":
    return kCVPixelFormatType_420YpCbCr8BiPlanarFullRange
  case "a2vy":
    return kCVPixelFormatType_422YpCbCr_4A_8BiPlanar
  case "422v":
    return kCVPixelFormatType_422YpCbCr8BiPlanarVideoRange
  case "422f":
    return kCVPixelFormatType_422YpCbCr8BiPlanarFullRange
  case "444v":
    return kCVPixelFormatType_444YpCbCr8BiPlanarVideoRange
  case "444f":
    return kCVPixelFormatType_444YpCbCr8BiPlanarFullRange
  default:
    throw EnumParserError.invalidValue
  }
}
