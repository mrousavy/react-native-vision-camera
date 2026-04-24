///
/// AV+RecorderFileType.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules
import UniformTypeIdentifiers

extension RecorderFileType {
  func toAVFileType() -> AVFileType {
    switch self {
    case .mp4:
      return .mp4
    case .mov:
      return .mov
    }
  }

  func toUTType() -> UTType {
    switch self {
    case .mp4:
      return .mpeg4Movie
    case .mov:
      return .quickTimeMovie
    }
  }
}
