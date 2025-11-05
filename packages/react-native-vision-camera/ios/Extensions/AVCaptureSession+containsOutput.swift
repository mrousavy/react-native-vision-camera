///
/// AVCaptureSession+containsOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

extension AVCaptureSession {
  func containsOutput(_ outputSpec: any HybridCameraSessionOutputSpec) -> Bool {
    // 1. Downcast
    guard let hybridOutput = outputSpec as? CameraSessionOutput else {
      return false
    }
    // 2. Find if it is contained
    return outputs.contains { output in
      return output == hybridOutput.output
    }
  }
  
  func removeOtherOutputs(except: [any HybridCameraSessionOutputSpec]) throws {
    // 1. Downcast outputs to [AVCaptureOutput]
    let targetOutputs = try except.map { output in
      guard let hybridOutput = output as? CameraSessionOutput else {
        throw RuntimeError.error(withMessage: "Output \(output) does not conform to `CameraSessionOutput`!")
      }
      return hybridOutput.output
    }
    // 2. Loop through each output
    for existingOutput in outputs {
      // 3. If it shouldn't exist in our target array, we remove it
      let shouldExist = targetOutputs.contains(existingOutput)
      if !shouldExist {
        removeOutput(existingOutput)
      }
    }
  }
  
  func addNewOutputs(from: [any HybridCameraSessionOutputSpec]) throws {
    let currentOutputs = outputs
    // 1. Loop through each output
    for output in from {
      guard let hybridOutput = output as? CameraSessionOutput else {
        throw RuntimeError.error(withMessage: "Output \(output) does not conform to `AVCaptureOutput`!")
      }
      // 3. If it doesn't exist in our current array, we add it
      let alreadyExists = currentOutputs.contains(hybridOutput.output)
      if !alreadyExists {
        try addOutput(output)
      }
    }
  }
}
