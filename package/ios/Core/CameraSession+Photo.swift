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

      // embedded thumbnail for fast thumbnail generation
      if options.onThumbnailReadyEvent != nil {
        // Request an embedded thumbnail to be included with the photo
        // This is much faster than generating our own thumbnail from the full image
        let thumbnailFormat: [String: Any] = [
          AVVideoCodecKey: AVVideoCodecType.jpeg,
          AVVideoWidthKey as String: min(320, Int(options.thumbnailSize?.width ?? 320)),
          AVVideoHeightKey as String: min(320, Int(options.thumbnailSize?.height ?? 320)),
        ]

        // Check if embedded thumbnails are supported
        if !photoSettings.availableEmbeddedThumbnailPhotoCodecTypes.isEmpty {
          photoSettings.embeddedThumbnailPhotoFormat = thumbnailFormat
        }
      }

      // Actually do the capture!
      let photoCaptureDelegate = PhotoCaptureDelegate(promise: promise,
                                                      enableShutterSound: options.enableShutterSound,
                                                      metadataProvider: self.metadataProvider,
                                                      path: options.path,
                                                      thumbnailSize: options.thumbnailSize,
                                                      onThumbnailReadyEvent: options.onThumbnailReadyEvent,
                                                      cameraSessionDelegate: self.delegate)
      photoOutput.capturePhoto(with: photoSettings, delegate: photoCaptureDelegate)

      // Assume that `takePhoto` is always called with the same parameters, so prepare the next call too.
      photoOutput.setPreparedPhotoSettingsArray([photoSettings], completionHandler: nil)
    }
  }
}
