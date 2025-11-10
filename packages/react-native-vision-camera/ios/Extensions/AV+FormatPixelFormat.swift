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
    case .hdep:
      self = .depth16Bit
    case .fdep:
      self = .depth32Bit
    case .hdis:
      self = .disparity16Bit
    case .fdis:
      self = .disparity32Bit
    case .pixelFormat_24RGB:
      print("pixelFormat_24RGB!")
      self = .yuv4208BitFull
    case .pixelFormat_32ARGB:
      print("yuv4208BitFull!")
      self = .yuv4208BitFull
    case .pixelFormat_32BGRA:
      print("pixelFormat_32BGRA!")
      self = .yuv4208BitFull
    case .pixelFormat_16BE565:
      print("pixelFormat_16BE565!")
      self = .yuv4208BitFull
    case .pixelFormat_422YpCbCr8:
      print("pixelFormat_422YpCbCr8!")
      self = .yuv4208BitFull
    case .pixelFormat_444YpCbCr8:
      print("pixelFormat_444YpCbCr8!")
      self = .yuv4208BitFull
    case .pixelFormat_422YpCbCr10:
      print("pixelFormat_422YpCbCr10!")
      self = .yuv4208BitFull
    case .pixelFormat_422YpCbCr16:
      print("pixelFormat_422YpCbCr16!")
      self = .yuv4208BitFull
    case .pixelFormat_444YpCbCr10:
      print("pixelFormat_444YpCbCr10!")
      self = .yuv4208BitFull
    case .pixelFormat_4444YpCbCrA8:
      print("pixelFormat_4444YpCbCrA8!")
      self = .yuv4208BitFull
    case .pixelFormat_422YpCbCr8_yuvs:
      print("pixelFormat_422YpCbCr8_yuvs!")
      self = .yuv4208BitFull
    default:
      print("UNKNOWN! \(mediaSubType)")
      self = .unknown
    }
  }
}

