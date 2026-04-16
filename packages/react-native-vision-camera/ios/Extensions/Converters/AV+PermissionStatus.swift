///
/// AV+PermissionStatus.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension PermissionStatus {
  init(avStatus: AVAuthorizationStatus) {
    switch avStatus {
    case .notDetermined:
      self = .notDetermined
    case .restricted:
      self = .restricted
    case .denied:
      self = .denied
    case .authorized:
      self = .authorized
    @unknown default:
      fatalError("Received unknown AVAuthorizationStatus! \(avStatus)")
    }
  }
}
