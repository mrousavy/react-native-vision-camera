//
//  AVCaptureVideoDataOutput+findPixelFormat.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 21.09.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation

extension AVCaptureVideoDataOutput {
  /**
   Of the given list, find the first that is available on this video data output.
   If none are supported, this returns nil.
   */
  func findPixelFormat(firstOf pixelFormats: [OSType]) -> OSType? {
    return pixelFormats.first { format in
      availableVideoPixelFormatTypes.contains(format)
    }
  }
}
