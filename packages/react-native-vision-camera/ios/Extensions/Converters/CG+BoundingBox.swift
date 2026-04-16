///
/// CG+BoundingBox.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension BoundingBox {
  init(_ cgRect: CGRect) {
    self.init(x: cgRect.minX, y: cgRect.minY, width: cgRect.width, height: cgRect.height)
  }
}
