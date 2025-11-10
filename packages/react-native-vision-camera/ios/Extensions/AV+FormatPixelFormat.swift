///
/// AV+FormatPixelFormat.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension FormatPixelFormat {
  init(mediaSubType: CMFormatDescription.MediaSubType) {
    switch mediaSubType {
    case .depth16Bit:
      self = .depth16Bit
    case .depth32Bit:
      self = .depth32Bit
    case .disparity16Bit:
      self = .disparity16Bit
    case .disparity32Bit:
      self = .disparity32Bit
    case .yuv4208BitVideo:
      self = .yuv4208BitVideo
    case .yuv4208BitFull:
      self = .yuv4208BitFull
    case .yuv42010BitVideo:
      self = .yuv42010BitVideo
    case .yuv42010BitFull:
      self = .yuv42010BitFull
    case .rgbBgra32Bit:
      self = .rgbBgra32Bit
    default:
      print("Unknown Format PixelFormat: \"\(mediaSubType)\"")
      self = .unknown
    }
  }
}

