///
/// AVCaptureSession+containsAudioConnection.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureSession {
  func containsAudioConnection(to output: AVCaptureOutput) -> Bool {
    return self.connections.contains { connection in
      return connection.isConnectedToAudioInput && connection.output == output
    }
  }
}
