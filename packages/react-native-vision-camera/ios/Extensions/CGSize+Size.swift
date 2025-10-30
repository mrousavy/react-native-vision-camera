///
/// CGSize+Size.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension Size {
  static var zero = Size(width: 0, height: 0)

  init(_ cgSize: CGSize) {
    self.init(width: cgSize.width, height: cgSize.height)
  }

  func toCGSize() -> CGSize {
    return CGSize(width: width, height: height)
  }
}
