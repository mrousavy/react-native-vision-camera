///
/// AVCaptureSession+containsInput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureSession {
  func containsInput(_ deviceSpec: any HybridCameraDeviceSpec) throws -> Bool {
    guard let nativeInput = deviceSpec as? any NativeCameraDevice else {
      throw RuntimeError.error(
        withMessage: "Input \"\(deviceSpec)\" is not of type `NativeCameraDevice`!")
    }
    for input in self.inputs {
      guard let deviceInput = input as? AVCaptureDeviceInput else {
        continue
      }
      if deviceInput.device == nativeInput.device {
        return true
      }
    }
    return false
  }
}
