///
/// AVCaptureConnection+isConnectedTo.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureConnection {
  func isConnectedTo(output: any HybridCameraOutputSpec) -> Bool {
    switch output {
    case let hybridOutput as any NativeCameraOutput:
      // compare AVCaptureOutput
      return self.output == hybridOutput.output
    case let hybridPreview as any NativePreviewViewOutput:
      // compare AVCapturePreviewLayer
      return self.videoPreviewLayer == hybridPreview.previewLayer
    default:
      // wrong type
      return false
    }
  }
}
