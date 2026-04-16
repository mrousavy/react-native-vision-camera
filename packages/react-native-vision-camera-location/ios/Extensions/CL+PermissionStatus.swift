///
/// CL+PermissionStatus.swift
/// VisionCameraLocation
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import CoreLocation

extension PermissionStatus {
  init(clStatus: CLAuthorizationStatus) {
    switch clStatus {
    case .notDetermined:
      self = .notDetermined
    case .restricted:
      self = .restricted
    case .denied:
      self = .denied
    case .authorized, .authorizedAlways, .authorizedWhenInUse:
      self = .authorized
    @unknown default:
      fatalError("Received unknown CLAuthorizationStatus! \(clStatus)")
    }
  }
}
