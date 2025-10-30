///
/// Resolution+toCMVideoDimensions.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension Resolution {
  init(dimensions: CMVideoDimensions) {
    self.init(width: Double(dimensions.width), height: Double(dimensions.height))
  }
  
  func toCMVideoDimensions() -> CMVideoDimensions {
    return CMVideoDimensions(width: Int32(width), height: Int32(height))
  }
}
