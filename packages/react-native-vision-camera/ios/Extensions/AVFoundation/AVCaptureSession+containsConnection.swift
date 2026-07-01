///
/// AVCaptureSession+containsConnection.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureSession {
  // TODO: Wait I think this is wrong and doesn't cover all outputs..?
  func contains(connection: ResolvedCameraSessionConnection) -> Bool {
    return self.connections.contains { c in
      return connection.contains(connection: c)
    }
  }
  func containsConnection(
    input: AVCaptureDevice,
    output: ResolvedCameraSessionConnection.Output
  ) -> Bool {
    return self.connections.contains { connection in
      return connection.deviceInput == input && connection.isConnectedTo(output: output)
    }
  }
}
