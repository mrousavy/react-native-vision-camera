///
/// CGRect+Rect.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension Rect {
  static var zero = Rect(x: 0, y: 0, width: 0, height: 0)

  init(_ cgRect: CGRect) {
    self.init(x: cgRect.minX, y: cgRect.minY, width: cgRect.width, height: cgRect.height)
  }

  func toCGRect() -> CGRect {
    return CGRect(x: x, y: y, width: width, height: height)
  }
}
