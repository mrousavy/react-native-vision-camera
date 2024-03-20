//
//  LocationProvider.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 20.03.24.
//

import Foundation
import CoreLocation

class LocationProvider {
  private let locationManager = CLLocationManager()

  init() {
    locationManager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters
    locationManager.startUpdatingLocation()
    locationManager.startUpdatingHeading()
  }

  deinit {
    locationManager.stopUpdatingLocation()
    locationManager.stopUpdatingHeading()
  }
  
  private var authorizationStatus: CLAuthorizationStatus {
    if #available(iOS 14.0, *) {
      return locationManager.authorizationStatus
    } else {
      return CLLocationManager.authorizationStatus()
    }
  }

  var hasPermission: Bool {
    switch authorizationStatus {
    case .authorizedAlways, .authorizedWhenInUse:
      return true
    default:
      return false
    }
  }

  var location: CLLocation? {
    return locationManager.location
  }
  
  var heading: CLHeading? {
    return locationManager.heading
  }
}
