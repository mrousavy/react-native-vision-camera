///
/// AVCaptureSession+containsOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureSession {
  func containsOutput(_ outputSpec: any HybridCameraOutputSpec) throws -> Bool {
    switch outputSpec {
    case let hybridOutput as any NativeCameraOutput:
      // It's a normal AVCaptureOutput
      return outputs.contains(hybridOutput.output)
    case let hybridPreview as any NativePreviewViewOutput:
      // It's an AVVideoPreviewLayer - this is a bit different than normal outputs:
      // We "add" it by setting its .session property.
      return hybridPreview.previewLayer.session == self
    default:
      throw RuntimeError.error(
        withMessage:
          "Output \"\(outputSpec)\" is not of type `NativeCameraOutput` or `NativePreviewViewOutput`!"
      )
    }
  }
}
