///
/// HybridCameraSessionPhotoOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation
import NitroImage

class HybridCameraSessionPhotoOutput: HybridCameraSessionPhotoOutputSpec, NativeCameraOutput {
  let type: CameraOutputType = .photo
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
    // 1. Prepare delegate that will resolve/reject Promise
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

    // 2. Prepare Photo settings
    let captureSettings = settings.toAVCapturePhotoSettings()
    // 3. Perform capture
    photoOutput.capturePhoto(with: captureSettings, delegate: delegate)
    // 4. Prepare settings for next photo capture so it'll be faster
    photoOutput.setPreparedPhotoSettingsArray([captureSettings])
    return promise
  }
}
