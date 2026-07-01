///
/// AVCaptureSession+containsInput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureSession {
  func containsInput(_ deviceOrPosition: CameraDeviceOrPosition) throws -> Bool {
    let device = try AVCaptureDevice.resolve(value: deviceOrPosition)
    return self.inputs.contains { input in
      guard let deviceInput = input as? AVCaptureDeviceInput else {
        return false
      }
      return deviceInput.device == device
    }
  }
}
