///
/// AV+DepthDataQuality.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension DepthDataQuality {
  init(av: AVDepthData.Quality) {
    switch av {
    case .low:
      self = .low
    case .high:
      self = .high
    @unknown default:
      self = .unknown
    }
  }
}
