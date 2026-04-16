///
/// AV+PixelFormat.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension PixelFormat {
  init(osType: OSType) {
    let mediaSubType = CMFormatDescription.MediaSubType(rawValue: osType)
    self.init(mediaSubType: mediaSubType)
  }

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
    case .yuv4228BitVideo:
      self = .yuv4228BitVideo
    case .yuv4228BitFull:
      self = .yuv4228BitFull
    case .yuv42210BitVideo:
      self = .yuv42210BitVideo
    case .yuv42210BitFull:
      self = .yuv42210BitFull
    case .yuv4448BitVideo:
      self = .yuv4448BitVideo
    case .rgbBgra8Bit:
      self = .rgbBgra8Bit
    case .rgbRgba8Bit:
      self = .rgbRgba8Bit
    case .rgbRgb8Bit:
      self = .rgbRgb8Bit
    case .rawBayerPacked9612Bit:
      self = .rawBayerPacked9612Bit
    case .rawBayerUnpacked16Bit:
      self = .rawBayerUnpacked16Bit
    default:
      let stringified = Self.fourCharCodeToString(mediaSubType.rawValue)
      logger.error("Unknown Format PixelFormat: \"\(stringified)\"")
      self = .unknown
    }
  }

  private static func fourCharCodeToString(_ code: FourCharCode) -> String {
    let bytes: [UInt8] = [
      UInt8((code >> 24) & 0xFF),
      UInt8((code >> 16) & 0xFF),
      UInt8((code >> 8) & 0xFF),
      UInt8(code & 0xFF),
    ]

    return String(bytes: bytes, encoding: .ascii) ?? "????"
  }
}
