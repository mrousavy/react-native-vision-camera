///
/// HybridMeteringPoint.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import CoreGraphics
import Foundation
import NitroModules

final class HybridMeteringPoint: HybridMeteringPointSpec {
  var relativeX: Double
  var relativeY: Double
  var relativeSize: Double?

  var normalizedX: Double
  var normalizedY: Double
  var normalizedSize: Double

  init(normalizedX: Double, normalizedY: Double, normalizedSize: Double) {
    self.relativeX = normalizedX
    self.relativeY = normalizedY
    self.relativeSize = normalizedSize
    self.normalizedX = normalizedX
    self.normalizedY = normalizedY
    self.normalizedSize = normalizedSize
  }
  init(
    relativeX: Double, relativeY: Double, relativeSize: Double?, normalizedX: Double,
    normalizedY: Double
  ) {
    self.relativeX = relativeX
    self.relativeY = relativeY
    self.relativeSize = relativeSize
    self.normalizedX = normalizedX
    self.normalizedY = normalizedY

    if let relativeSize {
      let fullX = relativeX / normalizedX
      self.normalizedSize = relativeSize / fullX
    } else {
      self.normalizedSize = 0.1
    }
  }

  func toNormalizedPoint() -> CGPoint {
    return CGPoint(x: normalizedX, y: normalizedY)
  }
}
