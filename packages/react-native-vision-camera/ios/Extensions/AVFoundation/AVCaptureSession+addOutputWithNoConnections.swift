///
/// AVCaptureSession+addOutputWithNoConnections.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureSession {
  func addOutputWithNoConnections(_ outputSpec: any HybridCameraOutputSpec) throws {
    switch outputSpec {
    case let hybridOutput as any NativeCameraOutput:
      // It's a normal AVCaptureOutput
      let output = hybridOutput.output
      guard output.connections.isEmpty else {
        throw RuntimeError.error(withMessage: "The given Output \"\(output)\" is already connected to a different Camera Session!")
      }
      guard canAddOutput(output) else {
        throw RuntimeError.error(
          withMessage: "Output \"\(output)\" cannot be added to Camera Session!")
      }
      logger.info("Adding Output \(output)...")
      addOutputWithNoConnections(output)
    case let hybridPreview as any NativePreviewViewOutput:
      // It's an AVVideoPreviewLayer - we need to set its .session
      guard hybridPreview.previewLayer.session == nil else {
        throw RuntimeError.error(withMessage: "The given Preview Output \"\(hybridPreview)\" is already connected to a different Camera Session!")
      }
      logger.info("Adding Preview \(hybridPreview.previewLayer)...")
      hybridPreview.previewLayer.setSessionWithNoConnection(self)
    default:
      throw RuntimeError.error(
        withMessage:
          "Output \"\(outputSpec)\" is not of type `NativeCameraOutput` or `NativePreviewViewOutput`!"
      )
    }
  }
}
