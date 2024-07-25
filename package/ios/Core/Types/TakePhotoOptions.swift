//
//  TakePhotoOptions.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 25.07.24.
//

import AVFoundation
import Foundation

struct TakePhotoOptions {
  var flash: Flash = .off
  var path: URL
  var enableAutoRedEyeReduction = false
  var enableAutoDistortionCorrection = false
  var enableShutterSound = true

  init(fromJSValue dictionary: NSDictionary) throws {
    // Flash
    if let flashOption = dictionary["flash"] as? String {
      flash = try Flash(jsValue: flashOption)
    }
    // Red-Eye reduction
    if let enable = dictionary["enableAutoRedEyeReduction"] as? Bool {
      enableAutoRedEyeReduction = enable
    }
    // Distortion correction
    if let enable = dictionary["enableAutoDistortionCorrection"] as? Bool {
      enableAutoDistortionCorrection = enable
    }
    // Shutter sound
    if let enable = dictionary["enableShutterSound"] as? Bool {
      enableShutterSound = enable
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
