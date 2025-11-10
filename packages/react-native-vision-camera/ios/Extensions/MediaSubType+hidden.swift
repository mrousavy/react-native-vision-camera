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
  static let depth16Bit = try! DepthPixelFormat.depth16Bit.toCMMediaSubType()
  static let depth32Bit = try! DepthPixelFormat.depth32Bit.toCMMediaSubType()
  // Disparity
  static let disparity16Bit = try! DepthPixelFormat.disparity16Bit.toCMMediaSubType()
  static let disparity32Bit = try! DepthPixelFormat.disparity32Bit.toCMMediaSubType()

  // YUV 4:2:0 8-Bit
  static let yuv4208BitVideo = try! VideoPixelFormat.yuv4208BitVideo.toCMMediaSubType()
  static let yuv4208BitFull = try! VideoPixelFormat.yuv4208BitFull.toCMMediaSubType()
  // YUV 4:2:0 10-Bit
  static let yuv42010BitVideo = try! VideoPixelFormat.yuv42010BitVideo.toCMMediaSubType()
  static let yuv42010BitFull = try! VideoPixelFormat.yuv42010BitFull.toCMMediaSubType()
  // YUV 4:2:2 8-Bit
  static let yuv4228BitVideo = try! VideoPixelFormat.yuv4228BitVideo.toCMMediaSubType()
  static let yuv4228BitFull = try! VideoPixelFormat.yuv4228BitFull.toCMMediaSubType()
  // YUV 4:2:2 10-Bit
  static let yuv42210BitVideo = try! VideoPixelFormat.yuv42210BitVideo.toCMMediaSubType()
  static let yuv42210BitFull = try! VideoPixelFormat.yuv42210BitFull.toCMMediaSubType()
  // BGRA
  static let rgbBgra32Bit = try! VideoPixelFormat.rgbBgra32Bit.toCMMediaSubType()
}
