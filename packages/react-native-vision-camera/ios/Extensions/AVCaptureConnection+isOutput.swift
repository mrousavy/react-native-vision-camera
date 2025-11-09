///
/// AVCaptureConnection+isOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

extension AVCaptureConnection {
  func isOutput(_ output: any HybridCameraOutputSpec) -> Bool {
    if let hybridOutput = output as? NativeCameraOutput {
      // compare AVCaptureOutput
      return self.output == hybridOutput.output
    } else if let hybridPreview = output as? NativePreviewViewOutput {
      // compare AVCapturePreviewLayer
      return self.videoPreviewLayer == hybridPreview.previewLayer
    } else {
      // wrong type
      return false
    }
  }
}
