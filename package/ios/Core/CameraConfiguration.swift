//
//  CameraConfiguration.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import Foundation
import AVFoundation

class CameraConfiguration {
  var requiresSessionConfiguration = false
  var requiresFormatConfiguration = false
  var requiresDeviceConfiguration = false
  var requiresOutputsConfiguration = false
  var isDirty: Bool {
    get {
      return requiresSessionConfiguration || requiresFormatConfiguration || requiresDeviceConfiguration
    }
  }
  
  // Input
  var cameraId: String? = nil {
    didSet {
      requiresSessionConfiguration = true
    }
  }
  // Outputs
  var photo: OutputConfiguration<Photo> = .disabled {
    didSet {
      requiresOutputsConfiguration = true
    }
  }
  var video: OutputConfiguration<Video> = .disabled {
    didSet {
      requiresOutputsConfiguration = true
    }
  }
  var codeScanner: OutputConfiguration<CodeScanner> = .disabled {
    didSet {
      requiresOutputsConfiguration = true
    }
  }
  // Format
  var format: AVCaptureDevice.Format? = nil {
    didSet {
      requiresFormatConfiguration = true
    }
  }
  
  enum OutputConfiguration<T> {
    case disabled
    case enabled(config: T)
  }
  
  /**
   A Photo configuration
   */
  struct Photo {
    var enableHighQualityPhotos: Bool = false
    var enableDepthData: Bool = false
    var enablePortraitEffectsMatte: Bool = false
  }
  
  /**
   A Video configuration
   */
  struct Video {
    var pixelFormat: PixelFormat = .native
    var enableFrameProcessor = false
  }
}
