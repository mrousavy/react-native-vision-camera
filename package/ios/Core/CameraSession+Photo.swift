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
  func takePhoto(options: TakePhotoOptions, promise: Promise) {
    // Run on Camera Queue
    CameraQueues.cameraQueue.async {
      // Get Photo Output configuration
      guard let configuration = self.configuration else {
        promise.reject(error: .session(.cameraNotReady))
        return
      }
      guard configuration.photo != .disabled else {
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

      VisionLogger.log(level: .info, message: "Capturing photo...")

      // Create photo settings
      let photoSettings = AVCapturePhotoSettings()

      // set photo resolution
      if #available(iOS 16.0, *) {
        photoSettings.maxPhotoDimensions = photoOutput.maxPhotoDimensions
      } else {
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
      photoSettings.isAutoRedEyeReductionEnabled = options.enableAutoRedEyeReduction

      // distortion correction
      if #available(iOS 14.1, *) {
        photoSettings.isAutoContentAwareDistortionCorrectionEnabled = options.enableAutoDistortionCorrection
      }

      // flash
      if options.flash != .off {
        guard videoDeviceInput.device.hasFlash else {
          // If user enabled flash, but the device doesn't have a flash, throw an error.
          promise.reject(error: .capture(.flashNotAvailable))
          return
        }
      }
      if videoDeviceInput.device.isFlashAvailable {
        photoSettings.flashMode = options.flash.toFlashMode()
      }

      // Actually do the capture!
      let photoCaptureDelegate = PhotoCaptureDelegate(promise: promise,
                                                      enableShutterSound: options.enableShutterSound,
                                                      metadataProvider: self.metadataProvider,
                                                      path: options.path,
                                                      cameraSessionDelegate: self.delegate)
      photoOutput.capturePhoto(with: photoSettings, delegate: photoCaptureDelegate)

      // Assume that `takePhoto` is always called with the same parameters, so prepare the next call too.
      photoOutput.setPreparedPhotoSettingsArray([photoSettings], completionHandler: nil)
    }
  }
}
