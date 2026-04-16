///
/// ResolvableConstraint+BinnedConstraint.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation

extension BinnedConstraint: ResolvableConstraint {
  typealias ResolvedValue = Void

  func resolve(for format: AVCaptureDevice.Format) -> ConstraintResolution<Void> {
    let penalty: Double
    switch (format.isVideoBinned, self.binned) {
    case (true, true), (false, false):
      penalty = 0.0
    case (true, false):
      penalty = 1.0
    case (false, true):
      penalty = 2.0
    }
    return ConstraintResolution(
      penalty: ConstraintPenalty(distance: penalty),
      resolvedValue: ())
  }
}
