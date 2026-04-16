//
//  CLLocation+toEXIF.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.11.25.
//

import CoreLocation
import ImageIO

extension CLLocation {
  func toEXIF() -> [String: Any] {
    var gps: [String: Any] = [:]

    // GPS timestamps should be UTC
    let dateStamp = Self.gpsDateFormatter.string(from: timestamp)
    let timeStamp = Self.gpsTimeFormatter.string(from: timestamp)

    var lat = coordinate.latitude
    var lon = coordinate.longitude
    var latRef = "N"
    var lonRef = "E"

    if lat < 0 {
      lat = -lat
      latRef = "S"
    }
    if lon < 0 {
      lon = -lon
      lonRef = "W"
    }

    gps[kCGImagePropertyGPSDateStamp as String] = dateStamp
    gps[kCGImagePropertyGPSTimeStamp as String] = timeStamp
    gps[kCGImagePropertyGPSLatitudeRef as String] = latRef
    gps[kCGImagePropertyGPSLatitude as String] = lat
    gps[kCGImagePropertyGPSLongitudeRef as String] = lonRef
    gps[kCGImagePropertyGPSLongitude as String] = lon

    // Altitude only if we have a valid vertical accuracy
    if verticalAccuracy >= 0 {
      var alt = altitude
      let altRef: Int = alt < 0 ? 1 : 0
      if alt < 0 { alt = -alt }

      gps[kCGImagePropertyGPSAltitudeRef as String] = altRef
      gps[kCGImagePropertyGPSAltitude as String] = alt
    }

    return gps
  }

  private static let gpsDateFormatter: DateFormatter = {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US_POSIX")
    f.timeZone = TimeZone(secondsFromGMT: 0)
    f.dateFormat = "yyyy:MM:dd"
    return f
  }()

  private static let gpsTimeFormatter: DateFormatter = {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US_POSIX")
    f.timeZone = TimeZone(secondsFromGMT: 0)
    f.dateFormat = "HH:mm:ss.SSS"
    return f
  }()
}
