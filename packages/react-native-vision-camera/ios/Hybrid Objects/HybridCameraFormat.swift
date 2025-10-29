///
/// HybridCameraFormat.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraFormat: HybridCameraFormatSpec {
  let format: AVCaptureDevice.Format
  
  var photoResolution: Resolution {
    // TODO: split video from photo size
    let dimensions = format.formatDescription.presentationDimensions()
    return Resolution(width: dimensions.width, height: dimensions.height)
  }
  var videoResolution: Resolution {
    // TODO: split video from photo size
    let dimensions = format.formatDescription.presentationDimensions()
    return Resolution(width: dimensions.width, height: dimensions.height)
  }
  
  init(format: AVCaptureDevice.Format) {
    self.format = format
  }
}
