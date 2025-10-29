///
/// HybridCameraSessionPhotoOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraSessionPhotoOutput: HybridCameraSessionOutputSpec, CameraSessionOutput {
  let type: CameraSessionOutputType = .photo
  var output: AVCaptureOutput {
    return photoOutput
  }
  private let photoOutput = AVCapturePhotoOutput()
}
