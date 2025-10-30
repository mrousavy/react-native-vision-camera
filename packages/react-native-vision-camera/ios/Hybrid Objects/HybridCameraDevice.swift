///
/// HybridCameraDevice.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraDevice: HybridCameraDeviceSpec {
  let device: AVCaptureDevice
  let formats: [any HybridCameraFormatSpec]
  
  init(device: AVCaptureDevice) {
    self.device = device
    self.formats = device.formats.map { HybridCameraFormat(format: $0) }
  }
}
