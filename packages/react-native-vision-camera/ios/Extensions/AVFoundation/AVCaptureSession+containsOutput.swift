///
/// AVCaptureSession+containsOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureSession {
  func containsOutput(_ output: ResolvedCameraSessionConnection.Output) -> Bool {
    switch output {
    case .output(let output):
      return outputs.contains(output.output)
    case .preview(let previewLayer):
      return previewLayer.previewLayer.session == self
    }
  }
}
