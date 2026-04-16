///
/// ResolvableConstraint.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

struct ConstraintPenalty: Comparable, Equatable, Sendable {
  let distance: Double
  static func < (lhs: Self, rhs: Self) -> Bool {
    return lhs.distance < rhs.distance
  }
  static var noPenalty = ConstraintPenalty(distance: 0)
}

/// The result of resolving a constraint against a format.
/// Contains both the penalty (for format scoring) and the resolved value
/// (for enabled constraints), computed in a single pass.
struct ConstraintResolution<Value> {
  let penalty: ConstraintPenalty
  let resolvedValue: Value
}

/// A constraint that can be resolved against a format, returning both
/// a penalty (how far from ideal) and the actual achievable value.
protocol ResolvableConstraint {
  associatedtype ResolvedValue
  func resolve(for format: AVCaptureDevice.Format) throws(RuntimeError) -> ConstraintResolution<ResolvedValue>
}
