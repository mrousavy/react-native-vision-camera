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
      let path = try FileUtils.writeUIImageToTempFile(image: image)
      
      promise.resolve([
        "path": path.absoluteString,
        "width": image.size.width,
        "height": image.size.height,
        "orientation": orientation as Any,
        "isMirrored": false,
        "isRawPhoto": false
      ])
    } catch (let error) {
      promise.reject(error: .capture(.fileError), cause: error as NSError)
    }
    
  }
}
