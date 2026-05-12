///
/// AVCaptureDevice+minTorchStrength.swift
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation

extension AVCaptureDevice {
  /// The minimum supported torch strength level for this device.
  ///
  /// Apple's `setTorchModeOn(level:)` accepts `(0, AVCaptureMaxAvailableTorchLevel]`
  /// and rejects exactly `0` with an uncatchable `NSInvalidArgumentException`, so the
  /// lowest usable brightness is just above `0`. We expose a small positive floor
  /// rather than `0` so that callers can pass this value directly to
  /// `setTorchModeOn(level:)` without tripping that exception.
  var minTorchStrength: Double {
    return 0.001
  }
}
