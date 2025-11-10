///
/// MediaSubType+hidden.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension CMFormatDescription.MediaSubType {
  static let depth16Bit = try! DepthPixelFormat.depth16Bit.toCMMediaSubType()
  static let depth32Bit = try! DepthPixelFormat.depth32Bit.toCMMediaSubType()
  static let disparity16Bit = try! DepthPixelFormat.disparity16Bit.toCMMediaSubType()
  static let disparity32Bit = try! DepthPixelFormat.disparity32Bit.toCMMediaSubType()
  
  static let yuv4208BitVideo = try! VideoPixelFormat.yuv4208BitVideo.toCMMediaSubType()
  static let yuv4208BitFull = try! VideoPixelFormat.yuv4208BitFull.toCMMediaSubType()
  static let yuv42010BitVideo = try! VideoPixelFormat.yuv42010BitVideo.toCMMediaSubType()
  static let yuv42010BitFull = try! VideoPixelFormat.yuv42010BitFull.toCMMediaSubType()
  static let yuv42210BitVideo = try! VideoPixelFormat.yuv42210BitVideo.toCMMediaSubType()
  static let yuv42210BitFull = try! VideoPixelFormat.yuv42210BitFull.toCMMediaSubType()
  static let rgbBgra32Bit = try! VideoPixelFormat.rgbBgra32Bit.toCMMediaSubType()
}
