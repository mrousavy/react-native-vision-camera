///
/// AVCaptureSession+addInputWithNoConnections.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureSession {
  func addInputWithNoConnections(_ deviceSpec: any HybridCameraDeviceSpec) throws
    -> AVCaptureDeviceInput
  {
    guard let input = deviceSpec as? any NativeCameraDevice else {
      throw RuntimeError.error(
        withMessage: "Input \"\(deviceSpec)\" is not of type `NativeCameraDevice`!")
    }
    let deviceInput = try AVCaptureDeviceInput(device: input.device)
    guard canAddInput(deviceInput) else {
      throw RuntimeError.error(
        withMessage: "Input \"\(deviceInput)\" cannot be added to Camera Session!")
    }
    logger.info("Adding input \(deviceInput)...")
    addInputWithNoConnections(deviceInput)
    return deviceInput
  }
}
