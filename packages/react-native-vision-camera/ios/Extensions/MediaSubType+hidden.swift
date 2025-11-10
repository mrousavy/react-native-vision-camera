///
/// MediaSubType+hidden.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension CMFormatDescription.MediaSubType {
  // Depth
  static let depth16Bit = CMFormatDescription.MediaSubType(rawValue: kCVPixelFormatType_DepthFloat16)
  static let depth32Bit = CMFormatDescription.MediaSubType(rawValue: kCVPixelFormatType_DepthFloat32)
  // Disparity
  static let disparity16Bit = CMFormatDescription.MediaSubType(rawValue: kCVPixelFormatType_DisparityFloat16)
  static let disparity32Bit = CMFormatDescription.MediaSubType(rawValue: kCVPixelFormatType_DisparityFloat32)

  // YUV 4:2:0 8-Bit
  static let yuv4208BitVideo = CMFormatDescription.MediaSubType(rawValue: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange)
  static let yuv4208BitFull = CMFormatDescription.MediaSubType(rawValue: kCVPixelFormatType_420YpCbCr8BiPlanarFullRange)
  // YUV 4:2:0 10-Bit
  static let yuv42010BitVideo = CMFormatDescription.MediaSubType(rawValue: kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange)
  static let yuv42010BitFull = CMFormatDescription.MediaSubType(rawValue: kCVPixelFormatType_420YpCbCr10BiPlanarFullRange)
  // YUV 4:2:2 8-Bit
  static let yuv4228BitVideo = CMFormatDescription.MediaSubType(rawValue: kCVPixelFormatType_422YpCbCr8BiPlanarVideoRange)
  static let yuv4228BitFull = CMFormatDescription.MediaSubType(rawValue: kCVPixelFormatType_422YpCbCr8BiPlanarFullRange)
  // YUV 4:2:2 10-Bit
  static let yuv42210BitVideo = CMFormatDescription.MediaSubType(rawValue: kCVPixelFormatType_422YpCbCr10BiPlanarVideoRange)
  static let yuv42210BitFull = CMFormatDescription.MediaSubType(rawValue: kCVPixelFormatType_422YpCbCr10BiPlanarFullRange)
  // BGRA
  static let rgbBgra32Bit = CMFormatDescription.MediaSubType(rawValue: kCVPixelFormatType_32BGRA)
}
