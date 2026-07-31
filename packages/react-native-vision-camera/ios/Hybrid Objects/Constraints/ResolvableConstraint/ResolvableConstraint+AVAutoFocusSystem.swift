///
/// ResolvableConstraint+FPSConstraint.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation

extension AVCaptureDevice.Format.AutoFocusSystem: ResolvableConstraint {
  typealias ResolvedValue = Void

  func resolve(for format: AVCaptureDevice.Format) -> ConstraintResolution<Void> {
    let targetAutoFocusSystem = self
    let actualAutoFocusSystem = format.autoFocusSystem
    let penalty: Double
    switch (targetAutoFocusSystem, actualAutoFocusSystem) {
    case (.none, .none), (.contrastDetection, .contrastDetection), (.phaseDetection, .phaseDetection):
      penalty = 0.0
    case (.contrastDetection, .phaseDetection), (.phaseDetection, .contrastDetection):
      penalty = 1.0
    case (.none, .contrastDetection), (.none, .phaseDetection):
      penalty = 2.0
    case (.contrastDetection, .none), (.phaseDetection, .none):
      penalty = 3.0
    @unknown default:
      penalty = 4.0
    }
    return ConstraintResolution(
      penalty: ConstraintPenalty(distance: penalty),
      resolvedValue: ())
  }
}
