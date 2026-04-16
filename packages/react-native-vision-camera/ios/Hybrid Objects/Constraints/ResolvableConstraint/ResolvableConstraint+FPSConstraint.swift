///
/// ResolvableConstraint+FPSConstraint.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation

extension FPSConstraint: ResolvableConstraint {
  typealias ResolvedValue = Double

  func resolve(for format: AVCaptureDevice.Format) -> ConstraintResolution<Double> {
    let nearestRange = format.nearestFrameRateRange(containing: fps)
    let penalty = nearestRange.penalty(for: fps)
    let clampedFPS = min(max(fps, nearestRange.minFrameRate), nearestRange.maxFrameRate)
    return ConstraintResolution(
      penalty: ConstraintPenalty(distance: penalty),
      resolvedValue: clampedFPS)
  }
}

extension AVFrameRateRange {
  func contains(fps: Double) -> Bool {
    return fps >= self.minFrameRate && fps <= self.maxFrameRate
  }
  func penalty(for fps: Double) -> Double {
    if self.contains(fps: fps) {
      return 0.0
    } else {
      let undershoot = self.minFrameRate - fps
      let overshoot = fps - self.maxFrameRate
      return max(undershoot, overshoot)
    }
  }
}
extension AVCaptureDevice.Format {
  func nearestFrameRateRange(containing targetFPS: Double) -> AVFrameRateRange {
    let nearestRange = self.videoSupportedFrameRateRanges.min { left, right in
      return left.penalty(for: targetFPS) < right.penalty(for: targetFPS)
    }
    guard let nearestRange else { fatalError("Device has no formats!") }
    return nearestRange
  }
}
