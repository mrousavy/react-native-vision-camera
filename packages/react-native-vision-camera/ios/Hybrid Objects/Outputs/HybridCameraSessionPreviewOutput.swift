///
/// HybridCameraSessionPreviewOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraSessionPreviewOutput: HybridCameraSessionPreviewOutputSpec, NativePreviewViewOutput {
  let outputType: CameraOutputType = .preview
  let mediaType: MediaType = .video
  let previewLayer: AVCaptureVideoPreviewLayer

  override init() {
    self.previewLayer = AVCaptureVideoPreviewLayer()
    super.init()
  }
}
