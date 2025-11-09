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
    if let hybridOutput = outputSpec as? NativeCameraOutput {
      // It's a normal AVCaptureOutput
      return outputs.contains(hybridOutput.output)
    } else if let hybridPreview = outputSpec as? NativePreviewViewOutput {
      // It's an AVVideoPreviewLayer - this is a bit different than normal outputs:
      // We "add" it by setting it's .session property.
      return hybridPreview.previewLayer.session == self
    } else {
      return false
    }
  }
  
  func addOutputWithNoConnections(_ outputSpec: any HybridCameraOutputSpec) throws {
    if let hybridOutput = outputSpec as? NativeCameraOutput {
      // It's a normal AVCaptureOutput
      let output = hybridOutput.output
      guard canAddOutput(output) else {
        throw RuntimeError.error(withMessage: "Output \"\(output)\" cannot be added to Camera Session!")
      }
      addOutputWithNoConnections(output)
    } else if let hybridPreview = outputSpec as? NativePreviewViewOutput {
      // It's an AVVideoPreviewLayer - we need to set it's .session
      hybridPreview.previewLayer.setSessionWithNoConnection(self)
    } else {
      throw RuntimeError.error(withMessage: "Output \"\(outputSpec)\" is not of type `NativeCameraOutput` or `NativePreviewViewOutput`!")
    }
  }
}
