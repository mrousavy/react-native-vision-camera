///
/// HybridLocationManager.swift
/// VisionCameraLocation
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import CoreLocation
import VisionCamera

final class HybridLocationManagerFactory: HybridLocationManagerFactorySpec {
  func createLocationManager(options: LocationManagerOptions) -> any HybridLocationManagerSpec {
    return HybridLocationManager(options: options)
  }

  func createLocation(latitude: Double, longitude: Double) -> any HybridLocationSpec {
    let location = CLLocation(latitude: latitude, longitude: longitude)
    return HybridLocation(location: location)
  }
}
