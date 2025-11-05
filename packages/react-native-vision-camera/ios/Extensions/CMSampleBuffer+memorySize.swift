///
/// CMSampleBuffer+memorySize.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension CMSampleBuffer {
  var memorySize: Int {
    return CVPixelBufferGetDataSize(self)
  }
}
