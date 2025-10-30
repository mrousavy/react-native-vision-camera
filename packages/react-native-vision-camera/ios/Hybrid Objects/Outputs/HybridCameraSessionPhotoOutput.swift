///
/// HybridCameraSessionPhotoOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation
import NitroImage

class HybridCameraSessionPhotoOutput: HybridCameraSessionPhotoOutputSpec, CameraSessionOutput {
  let type: CameraSessionOutputType = .photo
  var output: AVCaptureOutput {
    return photoOutput
  }
  private let photoOutput = AVCapturePhotoOutput()
  
  func capturePhoto(settings: CapturePhotoSettings?,
                    callbacks: CapturePhotoCallbacks?) -> Promise<any HybridPhotoSpec> {
    let settings = settings ?? CapturePhotoSettings(flashMode: nil,
                                                    qualityPrioritization: nil,
                                                    enableDepthData: nil,
                                                    enableShutterSound: nil,
                                                    isAutoRedEyeReductionEnabled: nil,
                                                    isCameraCalibrationDataDeliveryEnabled: nil,
                                                    isAutoContentAwareDistortionCorrectionEnabled: nil,
                                                    isAutoVirtualDeviceFusionEnabled: nil)
    let callbacks = callbacks ?? CapturePhotoCallbacks(onWillBeginCapture: nil,
                                                       onWillCapturePhoto: nil,
                                                       onDidCapturePhoto: nil,
                                                       onDidFinishCapture: nil)
    let promise = Promise<any HybridPhotoSpec>()
    let delegate = CapturePhotoDelegate(
      onCaptured: { photo in
        let image = HybridPhoto(photo: photo)
        promise.resolve(withResult: image)
      },
      onError: { error in
        promise.reject(withError: error)
      },
      callbacks: callbacks)
    
    // TODO: Convert CapturePhotoSettings to AVCapturePhotoSettings
    let captureSettings = AVCapturePhotoSettings()
    if let flashMode = settings.flashMode {
      captureSettings.flashMode = .on
    }
    photoOutput.capturePhoto(with: .init(), delegate: delegate)
    return promise
  }
}
