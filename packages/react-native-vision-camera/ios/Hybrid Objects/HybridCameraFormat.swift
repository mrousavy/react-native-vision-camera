///
/// HybridCameraFormat.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraFormat: HybridCameraFormatSpec {
  let format: AVCaptureDevice.Format
  
  
  init(format: AVCaptureDevice.Format) {
    self.format = format
  }
}
