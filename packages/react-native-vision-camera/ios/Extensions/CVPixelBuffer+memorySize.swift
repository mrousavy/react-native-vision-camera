///
/// CVPixelBuffer+memorySize.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension CVPixelBuffer {
  var memorySize: Int {
    return CVPixelBufferGetBytesPerRow(self) * CVPixelBufferGetHeight(self)
  }
  
  func memorySize(ofPlaneIndex planeIndex: Int) -> Int {
    return CVPixelBufferGetBytesPerRowOfPlane(self, planeIndex) * CVPixelBufferGetHeightOfPlane(self, planeIndex)
  }
}
