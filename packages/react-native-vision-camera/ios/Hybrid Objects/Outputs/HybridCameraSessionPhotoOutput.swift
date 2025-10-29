///
/// HybridCameraSessionPhotoOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraSessionPhotoOutput: HybridCameraSessionPhotoOutputSpec, CameraSessionOutput {
  let type: CameraSessionOutputType = .photo
  var output: AVCaptureOutput {
    return photoOutput
  }
  private let photoOutput = AVCapturePhotoOutput()
  
  func capturePhoto() -> Promise<Void> {
    return Promise.parallel(CameraQueues.cameraQueue) {
      // TODO: Capture Photo
    }
  }
}
