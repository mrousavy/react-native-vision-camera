///
/// AVCaptureSession+containsInputDevice.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

extension AVCaptureSession {
  /**
   * Returns the `AVCaptureDeviceInput` for the given `AVCaptureDevice`, if it
   * is already added to this `AVCaptureSession`.
   *
   * If the `AVCaptureSession` does not yet contain this `AVCaptureDevice`,
   * a new `AVCaptureDeviceInput` will be opened and returned.
   */
  func input(forDevice device: AVCaptureDevice) throws -> AVCaptureDeviceInput {
    // 1. Try to find the device in our inputs
    for input in self.inputs {
      guard let deviceInput = input as? AVCaptureDeviceInput else {
        continue
      }
      if deviceInput.device == device {
        return deviceInput
      }
    }
    // 2. If not found, create it
    return try AVCaptureDeviceInput(device: device)
  }
}
