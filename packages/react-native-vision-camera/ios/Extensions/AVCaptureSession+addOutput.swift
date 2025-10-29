///
/// AVCaptureSession+addOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

extension AVCaptureSession {
  func addOutput(_ outputSpec: any HybridCameraSessionOutputSpec) throws {
    guard let outputHolder = outputSpec as? CameraSessionOutput else {
      throw RuntimeError.error(withMessage: "HybridCameraSessionOutputSpec \(outputSpec) is not of type CameraSessionOutput!")
    }
    let output = outputHolder.output
    guard self.canAddOutput(output) else {
      throw RuntimeError.error(withMessage: "Cannot add output \(String(describing: output)) to CameraSession!")
    }
    self.addOutput(output)
  }
}
