///
/// AVCaptureSession+addInput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

extension AVCaptureSession {
  func addInput(_ inputSpec: any HybridCameraDeviceSpec) throws {
    guard let hybridDevice = inputSpec as? HybridCameraDevice else {
      throw RuntimeError.error(withMessage: "HybridCameraDeviceSpec \(inputSpec) is not of type HybridCameraDevice!")
    }
    let device = hybridDevice.device
    let input = try AVCaptureDeviceInput(device: device)
    guard self.canAddInput(input) else {
      throw RuntimeError.error(withMessage: "Cannot add input device \(device.uniqueID) to CameraSession!")
    }
    self.addInput(input)
  }
}
