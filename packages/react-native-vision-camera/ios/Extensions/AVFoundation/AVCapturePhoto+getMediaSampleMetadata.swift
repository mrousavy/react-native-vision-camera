///
/// AVCapturePhoto+orientation.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCapturePhoto {
  func getMediaSampleMetadata() throws -> MediaSampleMetadata {
    guard let orientationAny = self.metadata[kCGImagePropertyOrientation as String],
      let exifOrientation = orientationAny as? UInt32
    else {
      throw RuntimeError.error(
        withMessage: "Photo did not contain a `kCGImagePropertyOrientation` metadata key!")
    }
    let uiOrientation = try UIImage.Orientation(fromExif: exifOrientation)
    let orientation = Orientation(uiOrientation: uiOrientation)
    let isMirrored = uiOrientation.isMirrored
    let timestamp = self.timestamp
    return MediaSampleMetadata(
      timestamp: timestamp,
      orientation: orientation,
      isMirrored: isMirrored)
  }
}
