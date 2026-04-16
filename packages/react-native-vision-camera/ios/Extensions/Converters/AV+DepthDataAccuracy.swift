///
/// AV+DepthDataAccuracy.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension DepthDataAccuracy {
  init(av: AVDepthData.Accuracy) {
    switch av {
    case .absolute:
      self = .absolute
    case .relative:
      self = .relative
    @unknown default:
      self = .unknown
    }
  }
}
