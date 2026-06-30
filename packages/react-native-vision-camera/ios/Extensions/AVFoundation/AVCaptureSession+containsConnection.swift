///
/// AVCaptureSession+containsConnection.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureSession {
  func contains(connection: ResolvedCameraSessionConnection) -> Bool {
    return self.connections.contains { c in
      return connection.contains(connection: c)
    }
  }
}
