///
/// AVMetadataItem+libraryTag.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVMetadataItem {
  static var libraryTag: AVMutableMetadataItem = {
    let item = AVMutableMetadataItem()
    item.keySpace = .quickTimeMetadata
    item.key = AVMetadataKey.quickTimeMetadataKeySoftware as (NSCopying & NSObjectProtocol)?
    item.value = "VisionCamera" as (NSCopying & NSObjectProtocol)?
    return item
  }()
}
