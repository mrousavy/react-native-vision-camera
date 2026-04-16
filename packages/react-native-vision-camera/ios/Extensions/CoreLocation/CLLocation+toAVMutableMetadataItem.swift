///
/// CLLocation+toAVMutableMetadataItem.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import CoreLocation
import Foundation

extension CLLocation {
  func toAVMutableMetadataItem() throws -> AVMutableMetadataItem {
    let item = AVMutableMetadataItem()
    item.keySpace = .quickTimeMetadata
    item.key = AVMetadataKey.quickTimeMetadataKeyLocationISO6709 as NSString
    item.value = try self.toISO6709String() as NSString
    item.dataType = kCMMetadataBaseDataType_UTF8 as String
    return item
  }
}
