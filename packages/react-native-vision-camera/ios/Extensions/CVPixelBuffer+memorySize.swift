///
/// CVPixelBuffer+memorySize.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension CVPixelBuffer {
  var memorySize: Int {
    return CVPixelBufferGetBytesPerRow(self) * CVPixelBufferGetHeight(self)
  }

  func memorySize(ofPlaneIndex planeIndex: Int) -> Int {
    return CVPixelBufferGetBytesPerRowOfPlane(self, planeIndex)
      * CVPixelBufferGetHeightOfPlane(self, planeIndex)
  }
}
