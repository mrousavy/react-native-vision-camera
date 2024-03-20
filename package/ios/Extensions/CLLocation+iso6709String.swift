//
//  CLLocation+iso6709String.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 20.03.24.
//

import Foundation
import CoreLocation

extension CLLocation {
  var iso6709String: String {
    let latitude = coordinate.latitude
    let longitude = coordinate.longitude
    let altitude = altitude

    return String(format: "%+07.4f%+08.4f/%.0f", latitude, longitude, altitude)
  }
}
