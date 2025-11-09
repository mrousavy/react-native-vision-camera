///
/// AVCaptureSession+containsInput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

extension AVCaptureSession {
  func containsInput(_ inputSpec: any HybridCameraDeviceSpec) -> Bool {
    // 1. Downcast
    guard let hybridInput = inputSpec as? HybridCameraDevice else {
      return false
    }
    // 2. Check if out inputs contains this device
    return containsInputDevice(hybridInput.device)
  }
  
  func containsInputDevice(_ device: AVCaptureDevice) -> Bool {
    return inputs.contains { input in
      guard let input = input as? AVCaptureDeviceInput else {
        return false
      }
      return device == input.device
    }
  }
  
  func addInputWithNoConnections(_ inputSpec: any HybridCameraDeviceSpec) throws {
    guard let hybridInput = inputSpec as? HybridCameraDevice else {
      throw RuntimeError.error(withMessage: "Input \"\(inputSpec)\" does not conform to `HybridCameraDevice`!")
    }
    let input = try hybridInput.getInput()
    guard canAddInput(input) else {
      throw RuntimeError.error(withMessage: "Input \"\(inputSpec)\" cannot be added to Camera Session!")
    }
    addInputWithNoConnections(input)
  }
}
