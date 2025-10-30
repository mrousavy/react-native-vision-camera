///
/// CGPoint+Point.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension Point {
  static var zero = Point(x: 0, y: 0)

  init(_ cgPoint: CGPoint) {
    self.init(x: cgPoint.x, y: cgPoint.y)
  }

  func toCGPoint() -> CGPoint {
    return CGPoint(x: x, y: y)
  }
}
