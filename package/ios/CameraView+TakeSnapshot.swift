//
//  CameraView+TakeSnapshot.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 26.02.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

import AVFoundation

extension CameraView {
  func takeSnapshot(options: NSDictionary, promise: Promise) {
    guard let image = try? previewView.takeSnapshot() else {
      return
    }

    do {
      let quality = options["quality"] as? Double ?? 100
      let path = try FileUtils.writeUIImageToTempFile(image: image, compressionQuality: quality / 100.0)

      promise.resolve([
        "path": path.absoluteString,
        "width": image.size.width,
        "height": image.size.height,
        "orientation": orientation as Any,
        "isMirrored": false,
      ])
    } catch let error as CameraError {
      promise.reject(error: error)
    } catch {
      promise.reject(error: .capture(.unknown(message: "An unknown error occured while capturing the snapshot!")), cause: error as NSError)
    }
  }
}
