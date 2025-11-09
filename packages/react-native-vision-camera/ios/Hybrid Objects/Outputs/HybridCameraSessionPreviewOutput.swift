///
/// HybridCameraSessionPreviewOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraSessionPreviewOutput: HybridCameraSessionPreviewOutputSpec, NativePreviewViewOutput {
  let type: CameraOutputType = .preview
  let previewLayer: AVCaptureVideoPreviewLayer

  override init() {
    self.previewLayer = AVCaptureVideoPreviewLayer()
    super.init()
  }
}
