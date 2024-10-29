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
  func takeSnapshot(options optionsDictionary: NSDictionary, promise: Promise) {
    withPromise(promise) {
      guard let snapshot = latestVideoFrame else {
        throw CameraError.capture(.snapshotFailed)
      }
      guard let imageBuffer = CMSampleBufferGetImageBuffer(snapshot.imageBuffer) else {
        throw CameraError.capture(.imageDataAccessError)
      }

      // Parse options
      let options = try TakeSnapshotOptions(fromJSValue: optionsDictionary)

      // Play shutter effect (JS event)
      self.onCaptureShutter(shutterType: .snapshot)

      // Grab latest frame, convert to UIImage, and save it
      let orientation = Orientation.portrait.relativeTo(orientation: snapshot.orientation)
      let ciImage = CIImage(cvPixelBuffer: imageBuffer)
      let image = UIImage(ciImage: ciImage, scale: 1.0, orientation: orientation.imageOrientation)
      try FileUtils.writeUIImageToFile(image: image,
                                       file: options.path,
                                       compressionQuality: options.quality)
      return [
        "path": options.path.absoluteString,
        "width": image.size.width,
        "height": image.size.height,
        "orientation": orientation.jsValue,
        "isMirrored": false,
      ]
    }
  }
}
