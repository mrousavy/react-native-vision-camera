///
/// AVCaptureSession+containsConnection.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureSession {
  func containsConnection(input: any HybridCameraDeviceSpec, output: any HybridCameraOutputSpec)
    throws -> Bool
  {
    // 1. Get the `AVCaptureDeviceInput` for our given `input` - this throws if it isn't attached yet.
    let deviceInput = try findDevice(for: input)
    // 2. Find out if we currently have a connection from this input to this output
    return self.connections.contains { connection in
      let isConnectedToInput = connection.inputPorts.contains { port in
        return port.input == deviceInput
      }
      return isConnectedToInput && connection.isConnectedTo(output: output)
    }
  }
}
