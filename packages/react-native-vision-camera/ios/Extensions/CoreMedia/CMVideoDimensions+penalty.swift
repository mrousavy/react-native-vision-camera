///
/// CMVideoDimensions+penalty.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import CoreMedia
import Foundation

/// Maximum relative difference in aspect ratio to still be considered a "match".
private let aspectRatioTolerance = 0.02
/// Weight multiplied by the aspect ratio difference when outside `aspectRatioTolerance`.
private let aspectMismatchWeight = 100.0

extension CMVideoDimensions {
  /// The longer edge of this size (orientation-independent).
  var long: Int32 { max(width, height) }
  /// The shorter edge of this size (orientation-independent).
  var short: Int32 { min(width, height) }

  /// Computes a comparable penalty score between `self` and `target`.
  ///
  /// Primary: sizes matching the target aspect ratio (within `aspectRatioTolerance`)
  /// are always preferred. Secondary: among the same aspect-ratio group, sizes are
  /// ranked by log-ratio of pixel counts (scale-invariant — treats 2x bigger and
  /// 2x smaller as equidistant).
  func penalty(_ target: CMVideoDimensions) -> Double {
    let targetAspectRatio = Double(target.long) / Double(target.short)
    let actualAspectRatio = Double(self.long) / Double(self.short)
    let aspectRatioDiff = Swift.abs(actualAspectRatio - targetAspectRatio) / targetAspectRatio
    let aspectRatioPenalty = aspectRatioDiff < aspectRatioTolerance ? 0.0 : aspectMismatchWeight * aspectRatioDiff

    let targetPixels = Double(target.width) * Double(target.height)
    let actualPixels = Double(width) * Double(height)
    let logPixelDistance = Swift.abs(log(actualPixels / targetPixels))

    return aspectRatioPenalty + logPixelDistance
  }
}

extension Array where Element == CMVideoDimensions {
  func nearest(to target: CMVideoDimensions) -> CMVideoDimensions? {
    return self.min { left, right in
      left.penalty(target) < right.penalty(target)
    }
  }
}
