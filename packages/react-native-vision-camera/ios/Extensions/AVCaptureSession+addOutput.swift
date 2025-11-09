///
/// AVCaptureSession+containsOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

extension AVCaptureSession {
  func containsOutput(_ outputSpec: any HybridCameraOutputSpec) -> Bool {
    // 1. Downcast
    guard let hybridOutput = outputSpec as? NativeCameraOutput else {
      return false
    }
    // 2. Find if it is contained
    return outputs.contains(hybridOutput.output)
  }
  
  func addOutputWithNoConnections(_ outputSpec: any HybridCameraOutputSpec) throws {
    guard let hybridOutput = outputSpec as? NativeCameraOutput else {
      throw RuntimeError.error(withMessage: "Output \"\(outputSpec)\" does not conform to `NativeCameraOutput`!")
    }
    let output = hybridOutput.output
    guard canAddOutput(output) else {
      throw RuntimeError.error(withMessage: "Output \"\(outputSpec)\" cannot be added to Camera Session!")
    }
    addOutputWithNoConnections(output)
  }
}
