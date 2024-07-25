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
    let filename = FileUtils.createRandomFileName(withExtension: "jpg")
    if let customPath = dictionary["path"] as? NSString {
      guard let url = URL(string: customPath as String) else {
        throw CameraError.capture(.invalidPath(path: customPath as String))
      }
      guard url.hasDirectoryPath else {
        throw CameraError.capture(.createTempFileError(message: "Path (\(customPath)) is not a directory!"))
      }
      path = url.appendingPathComponent(filename)
    } else {
      path = FileUtils.tempDirectory.appendingPathComponent(filename)
    }
  }
}
