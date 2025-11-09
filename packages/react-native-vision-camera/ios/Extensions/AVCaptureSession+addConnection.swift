///
/// AVCaptureSession+connectionFor.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

extension AVCaptureSession {
  func containsConnection(deviceInput: AVCaptureDeviceInput, output: any HybridCameraOutputSpec) -> Bool {
    return connections.contains { connection in
      let containsSamePort = connection.inputPorts.contains { deviceInput.ports.contains($0) }
      let isOutput = connection.isOutput(output)
      return containsSamePort && isOutput
    }
  }

  func addConnection(deviceInput: AVCaptureDeviceInput, output: any HybridCameraOutputSpec) throws {
    let connection = try AVCaptureConnection(input: deviceInput, output: output)
    guard self.canAddConnection(connection) else {
      throw RuntimeError.error(withMessage: "Connection \"\(connection)\" cannot be added to Camera Session!")
    }
    print("Adding Connection \(connection)...")
    self.addConnection(connection)
  }
}
