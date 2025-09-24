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

      // Create photo settings (for this capture)
      let photoSettings = Self.makePhotoSettings(from: photoOutput, options: options)

      // flash
      if options.flash != .off {
        guard videoDeviceInput.device.hasFlash else {
          promise.reject(error: .capture(.flashNotAvailable))
          return
        }
      }
      if videoDeviceInput.device.isFlashAvailable {
        photoSettings.flashMode = options.flash.toFlashMode()
      }

      // Actually do the capture!
      let photoCaptureDelegate = PhotoCaptureDelegate(
        promise: promise,
        enableShutterSound: options.enableShutterSound,
        metadataProvider: self.metadataProvider,
        path: options.path,
        cameraSessionDelegate: self.delegate
      )
      photoOutput.capturePhoto(with: photoSettings, delegate: photoCaptureDelegate)

      // Prepare next call with a *fresh* settings instance.
      // (Do not reuse the in-flight settings object to avoid NSInvalidArgumentException on newer iOS/devices.)
      let preparedSettings = Self.makePhotoSettings(from: photoOutput, options: options)
      if videoDeviceInput.device.isFlashAvailable {
        preparedSettings.flashMode = options.flash.toFlashMode()
      }
      photoOutput.setPreparedPhotoSettingsArray([preparedSettings], completionHandler: nil)
    }
  }

  // MARK: - Helpers

  /// Builds a new AVCapturePhotoSettings that mirrors current output capabilities and given options.
  private static func makePhotoSettings(from photoOutput: AVCapturePhotoOutput,
                                        options: TakePhotoOptions) -> AVCapturePhotoSettings {
    let photoSettings = AVCapturePhotoSettings()

    // photo resolution
    if #available(iOS 16.0, *) {
      photoSettings.maxPhotoDimensions = photoOutput.maxPhotoDimensions
    } else {
      photoSettings.isHighResolutionPhotoEnabled = photoOutput.isHighResolutionCaptureEnabled
    }

    // depth (only if supported)
    if photoOutput.isDepthDataDeliverySupported {
      photoSettings.isDepthDataDeliveryEnabled = photoOutput.isDepthDataDeliveryEnabled
    }

    // portrait effects matte (only if supported)
    if #available(iOS 12.0, *), photoOutput.isPortraitEffectsMatteDeliverySupported {
      photoSettings.isPortraitEffectsMatteDeliveryEnabled = photoOutput.isPortraitEffectsMatteDeliveryEnabled
    }

    // quality prioritization
    if #available(iOS 13.0, *) {
      photoSettings.photoQualityPrioritization = photoOutput.maxPhotoQualityPrioritization
    }

    // red-eye reduction
    photoSettings.isAutoRedEyeReductionEnabled = options.enableAutoRedEyeReduction

    // distortion correction (only if supported)
    if #available(iOS 14.1, *),
       photoOutput.isContentAwareDistortionCorrectionSupported {
      photoSettings.isAutoContentAwareDistortionCorrectionEnabled = options.enableAutoDistortionCorrection
    }

    return photoSettings
  }
}
