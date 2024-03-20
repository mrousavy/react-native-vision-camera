//
//  MetadataProvider.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 19.03.24.
//

import AVFoundation
import CoreLocation
import Foundation

class MetadataProvider: NSObject, AVCapturePhotoFileDataRepresentationCustomizer {
  /**
   Get or set the location provider to also set GPS tags for captured photos or videos.
   */
  var locationProvider: LocationProvider? = nil
  
  /**
   Adds AVCapturePhoto's metadata dictionary
   */
  func replacementMetadata(for photo: AVCapturePhoto) -> [String: Any]? {
    var properties = photo.metadata
    
    // Add branding info
    if var exifDictionary = properties[kCGImagePropertyExifDictionary as String] as? [String: Any] {
      exifDictionary[kCGImagePropertyExifUserComment as String] = "Captured with VisionCamera by mrousavy"
      properties[kCGImagePropertyExifDictionary as String] = exifDictionary
    }
    
    // Add GPS Location EXIF info
    let locationMetadata = createLocationMetadata()
    properties[kCGImagePropertyGPSDictionary as String] = locationMetadata
    
    return properties
  }

  /**
   Creates GPS EXIF data
   */
  func createLocationMetadata() -> NSMutableDictionary? {
    guard let locationProvider,
          let location = locationProvider.location else {
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

    if let heading = locationProvider.heading {
      gpsDictionary[kCGImagePropertyGPSImgDirectionRef] = "T"
      gpsDictionary[kCGImagePropertyGPSImgDirection] = heading.trueHeading
    }

    return gpsDictionary
  }
}
