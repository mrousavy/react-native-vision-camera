///
/// AVCaptureSession+addInputWithNoConnections.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureSession {
  func addInputWithNoConnections(_ deviceOrPosition: CameraDeviceOrPosition) throws
    -> AVCaptureDeviceInput
  {
    let device = try AVCaptureDevice.resolve(value: deviceOrPosition)
    let deviceInput = try AVCaptureDeviceInput(device: device)
    guard canAddInput(deviceInput) else {
      throw RuntimeError("Input \"\(deviceInput)\" cannot be added to Camera Session!")
    }
    logger.info("Adding input \(deviceInput)...")
    addInputWithNoConnections(deviceInput)
    return deviceInput
  }
}
