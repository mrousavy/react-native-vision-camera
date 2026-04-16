///
/// HybridLocation.swift
/// VisionCameraLocation
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import CoreLocation
import VisionCamera

final class HybridLocation: HybridLocationSpec, NativeLocation {
  let location: CLLocation

  var latitude: Double {
    return location.coordinate.latitude
  }
  var longitude: Double {
    return location.coordinate.longitude
  }
  var altitude: Double {
    return location.altitude
  }

  var horizontalAccuracy: Double {
    return location.horizontalAccuracy
  }

  var verticalAccuracy: Double {
    return location.verticalAccuracy
  }

  var timestamp: Double {
    let unixSeconds = location.timestamp.timeIntervalSince1970
    return unixSeconds * 1000.0
  }

  var isMock: Bool {
    if let source = location.sourceInformation {
      return source.isSimulatedBySoftware
    }
    return false
  }

  init(location: CLLocation) {
    self.location = location
    super.init()
  }
}
