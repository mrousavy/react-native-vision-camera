///
/// AV+InterruptionReason.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension InterruptionReason {
  init(reason: AVCaptureSession.InterruptionReason) {
    switch reason {
    case .videoDeviceNotAvailableInBackground:
      self = .videoDeviceNotAvailableInBackground
    case .audioDeviceInUseByAnotherClient:
      self = .audioDeviceInUseByAnotherClient
    case .videoDeviceInUseByAnotherClient:
      self = .videoDeviceInUseByAnotherClient
    case .videoDeviceNotAvailableWithMultipleForegroundApps:
      self = .videoDeviceNotAvailableWithMultipleForegroundApps
    case .videoDeviceNotAvailableDueToSystemPressure:
      self = .videoDeviceNotAvailableDueToSystemPressure
    case .sensitiveContentMitigationActivated:
      self = .sensitiveContentMitigationActivated
    @unknown default:
      self = .unknown
    }
  }
}
