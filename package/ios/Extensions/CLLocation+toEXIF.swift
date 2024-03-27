//
//  CLLocation+toEXIF.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 20.03.24.
//

import CoreLocation
import Foundation

extension CLLocation {
  /**
   Convert this CLLocation object to an EXIF dictionary for saving to images
   */
  func toEXIF(heading: CLHeading? = nil) -> NSMutableDictionary {
    let gpsDictionary = NSMutableDictionary()
    var latitude = coordinate.latitude
    var longitude = coordinate.longitude
    var altitude = altitude
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
    gpsDictionary[kCGImagePropertyGPSDateStamp] = formatter.string(from: timestamp)
    formatter.dateFormat = "HH:mm:ss"
    gpsDictionary[kCGImagePropertyGPSTimeStamp] = formatter.string(from: timestamp)
    gpsDictionary[kCGImagePropertyGPSLatitudeRef] = latitudeRef
    gpsDictionary[kCGImagePropertyGPSLatitude] = latitude
    gpsDictionary[kCGImagePropertyGPSLongitudeRef] = longitudeRef
    gpsDictionary[kCGImagePropertyGPSLongitude] = longitude
    gpsDictionary[kCGImagePropertyGPSDOP] = horizontalAccuracy
    gpsDictionary[kCGImagePropertyGPSAltitudeRef] = altitudeRef
    gpsDictionary[kCGImagePropertyGPSAltitude] = altitude

    if let heading {
      gpsDictionary[kCGImagePropertyGPSImgDirectionRef] = "T"
      gpsDictionary[kCGImagePropertyGPSImgDirection] = heading.trueHeading
    }

    return gpsDictionary
  }
}
