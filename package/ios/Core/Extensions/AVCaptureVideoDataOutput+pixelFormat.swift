//
//  AVCaptureVideoDataOutput+pixelFormat.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 12.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension AVCaptureVideoDataOutput {
  /**
   Gets or sets the PixelFormat this output streams in.
   By default, the first item in `availableVideoPixelFormatTypes` is chosen.
   */
  var pixelFormat: OSType {
    get {
      let current = videoSettings[String(kCVPixelBufferPixelFormatTypeKey)] as? OSType
      return current ?? availableVideoPixelFormatTypes.first!
    }
    set {
      videoSettings[String(kCVPixelBufferPixelFormatTypeKey)] = newValue
    }
  }
}
