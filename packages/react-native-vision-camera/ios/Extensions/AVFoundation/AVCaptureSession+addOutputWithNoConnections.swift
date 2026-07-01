///
/// AVCaptureSession+addOutputWithNoConnections.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureSession {
  func addOutputWithNoConnections(_ output: ResolvedCameraSessionConnection.Output) throws {
    switch output {
    case .output(let output):
      // It's a normal AVCaptureOutput
      let output = output.output
      guard output.connections.isEmpty else {
        throw RuntimeError.error(withMessage: "The given Output \"\(output)\" is already connected to a different Camera Session!")
      }
      guard canAddOutput(output) else {
        throw RuntimeError.error(
          withMessage: "Output \"\(output)\" cannot be added to Camera Session!")
      }
      logger.info("Adding Output \(output)...")
      addOutputWithNoConnections(output)

    case .preview(let preview):
      // It's an AVVideoPreviewLayer - we need to set its .session
      let previewLayer = preview.previewLayer
      guard previewLayer.session == nil else {
        throw RuntimeError.error(withMessage: "The given Preview Output \"\(previewLayer)\" is already connected to a different Camera Session!")
      }
      logger.info("Adding Preview \(previewLayer)...")
      previewLayer.setSessionWithNoConnection(self)
    }
  }
}
