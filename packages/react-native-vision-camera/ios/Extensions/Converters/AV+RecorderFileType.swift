///
/// AV+RecorderFileType.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension RecorderFileType {
  func toAVFileType() -> AVFileType {
    switch self {
    case .mp4:
      return .mp4
    case .mov:
      return .mov
    }
  }
}
