///
/// ResolvableConstraint+PixelFormatConstraint.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation

// TODO: Introduce something like `formatClass` for PixelFormat that says `yuv`, `raw`, or `rgb` - and within the same class we can have a lower penalty than outside

extension PixelFormatConstraint: ResolvableConstraint {
  typealias ResolvedValue = Void

  func resolve(for format: AVCaptureDevice.Format) -> ConstraintResolution<Void> {
    let formatPixelFormat = PixelFormat(mediaSubType: format.formatDescription.mediaSubType)
    let penalty = formatPixelFormat == self.pixelFormat ? 0.0 : 1.0
    return ConstraintResolution(
      penalty: ConstraintPenalty(distance: penalty),
      resolvedValue: ())
  }
}
