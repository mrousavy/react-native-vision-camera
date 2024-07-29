//
//  TakeSnapshotOptions.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 25.07.24.
//

import AVFoundation
import Foundation

struct TakeSnapshotOptions {
  var path: URL
  var quality: Double = 1.0

  init(fromJSValue dictionary: NSDictionary) throws {
    // Quality
    if let customQuality = dictionary["quality"] as? Double {
      quality = customQuality / 100.0
    }
    // Custom Path
    if let customPath = dictionary["path"] as? String {
      path = try FileUtils.getFilePath(customDirectory: customPath, fileExtension: "jpg")
    } else {
      path = try FileUtils.getFilePath(fileExtension: "jpg")
    }
  }
}
