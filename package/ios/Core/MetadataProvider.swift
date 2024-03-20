//
//  MetadataProvider.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 19.03.24.
//

import AVFoundation
import CoreLocation
import Foundation

/**
 A Provider for Photo (AVCapturePhoto) EXIF metadata, and Video (AVAssetWriter) metadata.
 */
class MetadataProvider: NSObject, AVCapturePhotoFileDataRepresentationCustomizer {
  /**
   Get or set the location provider to also set GPS tags for captured photos or videos.
   */
  var locationProvider: LocationProvider?

  // MARK: - Photo Metadata

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
  private func createLocationMetadata() -> NSMutableDictionary? {
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

  // MARK: - Video Metadata

  func getVideoMetadataFormatDescription() throws -> CMFormatDescription {
    // For GPS Location Writing
    let locationSpec = [
      kCMMetadataFormatDescriptionMetadataSpecificationKey_Identifier as String: AVMetadataIdentifier.quickTimeMetadataLocationISO6709,
      kCMMetadataFormatDescriptionMetadataSpecificationKey_DataType as String: kCMMetadataDataType_QuickTimeMetadataLocation_ISO6709,
    ] as [String: Any]
    // For Branding Writing
    let brandingSpec = [
      kCMMetadataFormatDescriptionMetadataSpecificationKey_Identifier as String: AVMetadataIdentifier.commonIdentifierDescription,
      kCMMetadataFormatDescriptionMetadataSpecificationKey_DataType as String: kCMMetadataBaseDataType_UTF8,
    ] as [String: Any]
    let metadataSpecifications: NSArray = [locationSpec, brandingSpec]

    var metadataFormatDescription: CMFormatDescription?
    CMMetadataFormatDescriptionCreateWithMetadataSpecifications(allocator: kCFAllocatorDefault,
                                                                metadataType: kCMMetadataFormatType_Boxed,
                                                                metadataSpecifications: metadataSpecifications,
                                                                formatDescriptionOut: &metadataFormatDescription)
    guard let metadataFormatDescription else {
      throw CameraError.capture(.failedWritingMetadata(cause: nil))
    }
    return metadataFormatDescription
  }

  func createVideoMetadata() -> [AVMetadataItem] {
    var metadata: [AVMetadataItem] = []

    // Add branding metadata
    let brandingMetadata = createBrandingMetadaItem()
    metadata.append(brandingMetadata)

    if let location = locationProvider?.location {
      // Add GPS Location metadata
      let locationMetadata = createLocationMetadataItem(location: location)
      metadata.append(locationMetadata)
    }

    return metadata
  }

  private func createBrandingMetadaItem() -> AVMetadataItem {
    let metadataItem = AVMutableMetadataItem()
    metadataItem.keySpace = .common
    metadataItem.key = AVMetadataKey.commonKeyDescription as NSString
    metadataItem.identifier = .commonIdentifierDescription
    metadataItem.value = "Captured with VisionCamera by mrousavy" as NSString
    metadataItem.dataType = kCMMetadataBaseDataType_UTF8 as String
    return metadataItem
  }

  private func createLocationMetadataItem(location: CLLocation) -> AVMetadataItem {
    let iso6709String = location.iso6709String
    let metadataItem = AVMutableMetadataItem()
    metadataItem.keySpace = .common
    metadataItem.key = AVMetadataKey.commonKeyLocation as NSString
    metadataItem.identifier = .commonIdentifierLocation
    metadataItem.value = iso6709String as NSString
    //metadataItem.dataType = kCMMetadataDataType_QuickTimeMetadataLocation_ISO6709 as String
    return metadataItem
  }
}
