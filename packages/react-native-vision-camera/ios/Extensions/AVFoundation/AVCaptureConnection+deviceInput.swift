///
/// AVCaptureConnection+deviceInput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureConnection {
  /**
   * Gets the connection's current input,
   * or `nil` if it has none, or if it
   * is a connection to a Preview Layer or
   * a metadata input.
   */
  var deviceInput: AVCaptureDeviceInput? {
    for port in inputPorts {
      if let deviceInput = port.input as? AVCaptureDeviceInput {
        return deviceInput
      }
    }
    return nil
  }
}
