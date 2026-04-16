///
/// CLLocation+toISO6709String.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import CoreLocation
import Foundation

extension CLLocation {
  enum ISO6709Error: Error {
    case invalidCoordinate
  }

  func toISO6709String(
    fractionalDigits: Int = 6,  // ~0.11 m at equator at 6 digits
    includeAltitudeWhenValid: Bool = true
  ) throws -> String {
    precondition(fractionalDigits >= 0 && fractionalDigits <= 12)

    let lat = coordinate.latitude
    let lon = coordinate.longitude

    guard lat.isFinite, lon.isFinite,
      lat >= -90.0, lat <= 90.0,
      lon >= -180.0, lon <= 180.0
    else {
      throw ISO6709Error.invalidCoordinate
    }

    @inline(__always)
    func normalizeNegZero(_ x: Double) -> Double { x == 0 ? 0 : x }

    let latN = normalizeNegZero(lat)
    let lonN = normalizeNegZero(lon)

    // No field widths needed; the important part is forced sign and fixed fraction digits.
    let latPart = String(format: "%+.\(fractionalDigits)f", latN)
    let lonPart = String(format: "%+.\(fractionalDigits)f", lonN)

    var s = latPart + lonPart

    if includeAltitudeWhenValid {
      let alt = altitude
      if verticalAccuracy >= 0, alt.isFinite {
        // Decimeters by default; you can make this configurable too.
        let altPart = String(format: "%+.1f", normalizeNegZero(alt))
        s += altPart
      }
    }

    s += "/"
    return s
  }
}
