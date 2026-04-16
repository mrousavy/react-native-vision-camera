///
/// CG+Point.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import CoreGraphics
import Foundation
import NitroModules

extension Point {
  init(_ cgPoint: CGPoint) {
    self.init(x: cgPoint.x, y: cgPoint.y)
  }

  func toCGPoint() -> CGPoint {
    return CGPoint(x: x, y: y)
  }
}

extension Point {
  func applying(_ transform: CGAffineTransform) -> Point {
    let cgResult = self.toCGPoint().applying(transform)
    return Point(cgResult)
  }
}
