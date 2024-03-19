//
//  CameraSession+Photo.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension CameraSession {
  /**
   Takes a photo.
   `takePhoto` is only available if `photo={true}`.
   */
  func takePhoto(options: NSDictionary, promise: Promise) {
    // Run on Camera Queue
    CameraQueues.cameraQueue.async {
      // Get Photo Output configuration
      guard let configuration = self.configuration else {
        promise.reject(error: .session(.cameraNotReady))
        return
      }
      guard case let .enabled(config: photo) = configuration.photo else {
        // User needs to enable photo={true}
        promise.reject(error: .capture(.photoNotEnabled))
        return
      }

      // Check if Photo Output is available
      guard let photoOutput = self.photoOutput,
            let videoDeviceInput = self.videoDeviceInput else {
        // Camera is not yet ready
        promise.reject(error: .session(.cameraNotReady))
        return
      }

      ReactLogger.log(level: .info, message: "Capturing photo...")

      // Create photo settings
      let photoSettings = AVCapturePhotoSettings()

      // high resolution capture
      if photo.enableHighQualityPhotos {
        // TODO: On iOS 16+ this will be removed in favor of maxPhotoDimensions.
        photoSettings.isHighResolutionPhotoEnabled = photoOutput.isHighResolutionCaptureEnabled
      }

      // depth data
      photoSettings.isDepthDataDeliveryEnabled = photoOutput.isDepthDataDeliveryEnabled
      if #available(iOS 12.0, *) {
        photoSettings.isPortraitEffectsMatteDeliveryEnabled = photoOutput.isPortraitEffectsMatteDeliveryEnabled
      }

      // quality prioritization
      if #available(iOS 13.0, *) {
        photoSettings.photoQualityPrioritization = photoOutput.maxPhotoQualityPrioritization
      }

      // red-eye reduction
      if #available(iOS 12.0, *), let autoRedEyeReduction = options["enableAutoRedEyeReduction"] as? Bool {
        photoSettings.isAutoRedEyeReductionEnabled = autoRedEyeReduction
      }

      // distortion correction
      if #available(iOS 14.1, *), let enableAutoDistortionCorrection = options["enableAutoDistortionCorrection"] as? Bool {
        photoSettings.isAutoContentAwareDistortionCorrectionEnabled = enableAutoDistortionCorrection
      }

      // flash
      if videoDeviceInput.device.isFlashAvailable, let flash = options["flash"] as? String {
        guard let flashMode = AVCaptureDevice.FlashMode(withString: flash) else {
          promise.reject(error: .parameter(.invalid(unionName: "FlashMode", receivedValue: flash)))
          return
        }
        photoSettings.flashMode = flashMode
      }

      // shutter sound
      let enableShutterSound = options["enableShutterSound"] as? Bool ?? true

      // Actually do the capture!
      let photoCaptureDelegate = PhotoCaptureDelegate(promise: promise,
                                                      enableShutterSound: enableShutterSound,
                                                      cameraSessionDelegate: self.delegate)
      photoOutput.capturePhoto(with: photoSettings, delegate: photoCaptureDelegate)

      // Assume that `takePhoto` is always called with the same parameters, so prepare the next call too.
      photoOutput.setPreparedPhotoSettingsArray([photoSettings], completionHandler: nil)
    }
  }
}
