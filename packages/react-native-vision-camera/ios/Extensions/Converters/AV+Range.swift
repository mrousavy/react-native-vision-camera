///
/// Range+toAVFrameRateRange.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension Range {
  init(range: AVFrameRateRange) {
    self.init(range.minFrameRate, range.maxFrameRate)
  }
}
