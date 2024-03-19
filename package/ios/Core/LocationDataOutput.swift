//
//  LocationDataOutput.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 19.03.24.
//

import AVFoundation
import CoreLocation
import Foundation

class LocationDataOutput: NSObject, AVCapturePhotoFileDataRepresentationCustomizer {
  private let locationManager = CLLocationManager()

  override init() {
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

  /**
   Adds GPS EXIF data to an AVCapturePhoto's metadata dictionary
   */
  func replacementMetadata(for photo: AVCapturePhoto) -> [String: Any]? {
    var properties = photo.metadata

    // Add GPS Location EXIF info
    let locationMetadata = createLocationMetadata()
    properties[kCGImagePropertyGPSDictionary as String] = locationMetadata
    return properties
  }

  /**
   Creates GPS EXIF data
   */
  func createLocationMetadata() -> NSMutableDictionary? {
    guard let location = locationManager.location else {
      return nil
    }

    let gpsDictionary = NSMutableDictionary()
    var latitude = location.coordinate.latitude
    var longitude = location.coordinate.longitude
    var altitude = location.altitude
    var latitudeRef = "N"
    var longitudeRef = "E"
    var altitudeRef = 0

    if latitude < 0.0 {
      latitude = -latitude
      latitudeRef = "S"
    }

    if longitude < 0.0 {
      longitude = -longitude
      longitudeRef = "W"
    }

    if altitude < 0.0 {
      altitude = -altitude
      altitudeRef = 1
    }

    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy:MM:dd"
    gpsDictionary[kCGImagePropertyGPSDateStamp] = formatter.string(from: location.timestamp)
    formatter.dateFormat = "HH:mm:ss"
    gpsDictionary[kCGImagePropertyGPSTimeStamp] = formatter.string(from: location.timestamp)
    gpsDictionary[kCGImagePropertyGPSLatitudeRef] = latitudeRef
    gpsDictionary[kCGImagePropertyGPSLatitude] = latitude
    gpsDictionary[kCGImagePropertyGPSLongitudeRef] = longitudeRef
    gpsDictionary[kCGImagePropertyGPSLongitude] = longitude
    gpsDictionary[kCGImagePropertyGPSDOP] = location.horizontalAccuracy
    gpsDictionary[kCGImagePropertyGPSAltitudeRef] = altitudeRef
    gpsDictionary[kCGImagePropertyGPSAltitude] = altitude

    if let heading = locationManager.heading {
      gpsDictionary[kCGImagePropertyGPSImgDirectionRef] = "T"
      gpsDictionary[kCGImagePropertyGPSImgDirection] = heading.trueHeading
    }

    return gpsDictionary
  }
}
