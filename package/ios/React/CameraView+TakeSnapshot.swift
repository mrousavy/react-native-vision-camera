//
//  CameraView+TakeSnapshot.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 26.02.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

import AVFoundation
import UIKit

extension CameraView {
  func takeSnapshot(options: NSDictionary, promise: Promise) {
    withPromise(promise) {
      guard let snapshot = latestVideoFrame else {
        throw CameraError.capture(.snapshotFailed)
      }
      guard let imageBuffer = CMSampleBufferGetImageBuffer(snapshot.imageBuffer) else {
        throw CameraError.capture(.imageDataAccessError)
      }
      var quality = 1.0
      if let customQuality = options["quality"] as? NSNumber {
        quality = (customQuality.doubleValue / 100.0)
      }
      var path = FileUtils.tempDirectory
      if let customPath = options["path"] as? NSString {
        guard let url = URL(string: customPath as String) else {
          throw CameraError.capture(.invalidPath(path: customPath as String))
        }
        guard url.hasDirectoryPath else {
          throw CameraError.capture(.createTempFileError(message: "Path (\(customPath)) is not a directory!"))
        }
        path = url
      }
      path = path.appendingPathComponent(FileUtils.createRandomFileName(withExtension: "jpg"))

      self.onCaptureShutter(shutterType: .snapshot)

      let orientation = Orientation.portrait.relativeTo(orientation: snapshot.orientation)
      let ciImage = CIImage(cvPixelBuffer: imageBuffer)
      let image = UIImage(ciImage: ciImage, scale: 1.0, orientation: orientation.imageOrientation)
      try FileUtils.writeUIImageToFile(image: image,
                                       file: path,
                                       compressionQuality: quality)
      return [
        "path": path.absoluteString,
        "width": image.size.width,
        "height": image.size.height,
        "orientation": orientation.jsValue,
        "isMirrored": false,
      ]
    }
  }
}
