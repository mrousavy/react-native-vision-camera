///
/// Range+toAVFrameRateRange.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension Range {
  init(min: Float, max: Float) {
    self.init(Double(min), Double(max))
  }
  init(range: AVFrameRateRange) {
    self.init(min: range.minFrameRate, max: range.maxFrameRate)
  }
  init(range: ClosedRange<CGFloat>) {
    self.init(min: range.lowerBound, max: range.upperBound)
  }
  init(range: ClosedRange<Float>) {
    self.init(min: range.lowerBound, max: range.upperBound)
  }
}
