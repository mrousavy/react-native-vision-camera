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
  
  func capturePhoto(callbacks: CapturePhotoCallbacks?) -> Promise<Void> {
    let callbacks = callbacks ?? CapturePhotoCallbacks(onWillBeginCapture: nil,
                                                       onWillCapturePhoto: nil,
                                                       onDidCapturePhoto: nil,
                                                       onDidFinishCapture: nil)
    let promise = Promise<Void>()
    let delegate = CapturePhotoDelegate(
      onCaptured: { photo in
        
      },
      onError: { error in
        
      },
      callbacks: callbacks)
    photoOutput.capturePhoto(with: .init(), delegate: delegate)
    return promise
  }
}
