///
/// Size+toCMVideoDimensions.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension Size {
  init(dimensions: CMVideoDimensions) {
    self.init(width: Double(dimensions.width), height: Double(dimensions.height))
  }

  func toCMVideoDimensions() -> CMVideoDimensions {
    return CMVideoDimensions(width: Int32(width), height: Int32(height))
  }
}
