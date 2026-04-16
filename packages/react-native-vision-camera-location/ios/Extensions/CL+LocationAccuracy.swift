///
/// CL+LocationAccuracy.swift
/// VisionCameraLocation
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import CoreLocation

extension LocationAccuracy {
  func toCLLocationAccuracy() -> CLLocationAccuracy {
    switch self {
    case .high:
      return kCLLocationAccuracyBest
    case .balanced:
      return kCLLocationAccuracyNearestTenMeters
    case .low:
      return kCLLocationAccuracyHundredMeters
    }
  }
}
