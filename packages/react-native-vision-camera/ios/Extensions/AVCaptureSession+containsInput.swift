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
    return inputs.contains { input in
      guard let input = input as? AVCaptureDeviceInput else {
        return false
      }
      return hybridInput.device == input.device
    }
  }
  
  func removeOtherInputs(except: [any HybridCameraDeviceSpec]) throws {
    // 1. Downcast inputs to [AVCaptureDevice]
    let targetDevices = try except.map { input in
      guard let hybridInput = input as? HybridCameraDevice else {
        throw RuntimeError.error(withMessage: "Input \(input) does not conform to `HybridCameraDevice`!")
      }
      return hybridInput.device
    }
    // 2. Loop through each input
    for existingInput in inputs {
      guard let existingDeviceInput = existingInput as? AVCaptureDeviceInput else {
        // Skip non-device inputs
        continue
      }
      // 3. If it shouldn't exist in our target array, we remove it
      let shouldExist = targetDevices.contains(existingDeviceInput.device)
      if !shouldExist {
        removeInput(existingInput)
      }
    }
  }
  
  func addNewInputs(from: [any HybridCameraDeviceSpec]) throws {
    // 1. Downcast inputs to [AVCaptureDevice]
    let currentInputs = inputs.compactMap { input -> AVCaptureDevice? in
      guard let deviceInput = input as? AVCaptureDeviceInput else {
        // we drop all non-device inputs
        return nil
      }
      return deviceInput.device
    }
    // 2. Loop through each device
    for input in from {
      guard let hybridInput = input as? HybridCameraDevice else {
        throw RuntimeError.error(withMessage: "Input \(input) does not conform to `HybridCameraDevice`!")
      }
      // 3. If it doesn't exist in our current array, we add it
      let alreadyExists = currentInputs.contains(hybridInput.device)
      if !alreadyExists {
        try addInput(input)
      }
    }
  }
}
