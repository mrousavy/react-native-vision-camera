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
  func takeSnapshot(options _: NSDictionary, promise: Promise) {
    withPromise(promise) {
      guard let snapshot = latestVideoFrame else {
        throw CameraError.capture(.snapshotFailed)
      }
      guard let imageBuffer = CMSampleBufferGetImageBuffer(snapshot) else {
        throw CameraError.capture(.imageDataAccessError)
      }

      self.onCaptureShutter(shutterType: .snapshot)

      let ciImage = CIImage(cvPixelBuffer: imageBuffer)
      let orientation = self.cameraSession.outputOrientation
      let image = UIImage(ciImage: ciImage, scale: 1.0, orientation: orientation.imageOrientation)
      let path = try FileUtils.writeUIImageToTempFile(image: image)
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
