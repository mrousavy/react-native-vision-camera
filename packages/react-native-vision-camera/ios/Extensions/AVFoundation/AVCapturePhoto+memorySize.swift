///
/// AVCapturePhoto+memorySize.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCapturePhoto {
  var memorySize: Int {
    var estimate: Int = 0

    // base native buffer (width * height * RGB)
    let width = resolvedSettings.photoDimensions.width
    let height = resolvedSettings.photoDimensions.width
    let bytesPerPixel = 3  // RGB
    estimate += Int(width) * Int(height) * bytesPerPixel

    // raw pixel buffer
    if let pixelBuffer {
      estimate += pixelBuffer.memorySize
    }

    // raw preview buffer
    if let previewPixelBuffer {
      estimate += previewPixelBuffer.memorySize
    }

    // raw depth data
    if let depthData {
      estimate += depthData.depthDataMap.memorySize
    }
    return estimate
  }
}
