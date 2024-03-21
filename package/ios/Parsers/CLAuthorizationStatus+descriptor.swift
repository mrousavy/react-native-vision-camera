//
//  CLAuthorizationStatus+descriptor.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 19.03.24.
//

import CoreLocation
import Foundation

extension CLAuthorizationStatus {
  var descriptor: String {
    switch self {
    case .authorized, .authorizedAlways, .authorizedWhenInUse:
      return "granted"
    case .denied:
      return "denied"
    case .notDetermined:
      return "not-determined"
    case .restricted:
      return "restricted"
    @unknown default:
      fatalError("CLAuthorizationStatus has unknown state.")
    }
  }
}
