///
/// AVCaptureDevice+maxTorchStrength.swift
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation

extension AVCaptureDevice {
  /// The maximum supported torch strength level for this device.
  ///
  /// `AVCaptureDevice.setTorchModeOn(level:)` accepts values up to
  /// `AVCaptureMaxAvailableTorchLevel`, which is always `1.0`.
  var maxTorchStrength: Double {
    return 1.0
  }
}
