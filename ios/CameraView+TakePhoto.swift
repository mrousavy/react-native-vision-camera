//
//  CameraView+TakePhoto.swift
//  Cuvent
//
//  Created by Marc Rousavy on 16.12.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import AVFoundation

// MARK: - TakePhotoOptions

struct TakePhotoOptions {
  init(fromDictionary dictionary: NSDictionary) {
    if let videoCodec = dictionary.value(forKey: "videoCodec") as? String {
      self.videoCodec = AVVideoCodecType(withString: videoCodec)
    }
    qualityPrioritization = dictionary.value(forKey: "qualityPrioritization") as? String
  }

  var videoCodec: AVVideoCodecType?
  var qualityPrioritization: String?
}

extension CameraView {
  func takePhoto(options: NSDictionary, promise: Promise) {
    cameraQueue.async {
      guard let photoOutput = self.photoOutput,
            let videoDeviceInput = self.videoDeviceInput else {
        if self.photo?.boolValue == true {
          return promise.reject(error: .session(.cameraNotReady))
        } else {
          return promise.reject(error: .capture(.photoNotEnabled))
        }
      }

      var photoSettings = AVCapturePhotoSettings()
      if let photoCodecString = options["photoCodec"] as? String {
        guard let photoCodec = AVVideoCodecType(withString: photoCodecString) else {
          return promise.reject(error: .capture(.invalidPhotoCodec))
        }
        if photoOutput.availablePhotoCodecTypes.contains(photoCodec) {
          photoSettings = AVCapturePhotoSettings(format: [AVVideoCodecKey: photoCodec])
        } else {
          return promise.reject(error: .parameter(.invalid(unionName: "PhotoCodec", receivedValue: photoCodecString)))
        }
      }
      if videoDeviceInput.device.isFlashAvailable, let flash = options["flash"] as? String {
        guard let flashMode = AVCaptureDevice.FlashMode(withString: flash) else {
          return promise.reject(error: .parameter(.invalid(unionName: "FlashMode", receivedValue: flash)))
        }
        photoSettings.flashMode = flashMode
      }
      photoSettings.isHighResolutionPhotoEnabled = photoOutput.isHighResolutionCaptureEnabled
      if !photoSettings.__availablePreviewPhotoPixelFormatTypes.isEmpty {
        photoSettings.previewPhotoFormat = [kCVPixelBufferPixelFormatTypeKey as String: photoSettings.__availablePreviewPhotoPixelFormatTypes.first!]
      }
      photoSettings.isDepthDataDeliveryEnabled = photoOutput.isDepthDataDeliveryEnabled
      photoSettings.embedsDepthDataInPhoto = photoSettings.isDepthDataDeliveryEnabled
      if #available(iOS 12.0, *) {
        photoSettings.isPortraitEffectsMatteDeliveryEnabled = photoOutput.isPortraitEffectsMatteDeliveryEnabled
        photoSettings.embedsPortraitEffectsMatteInPhoto = photoSettings.isPortraitEffectsMatteDeliveryEnabled
      }
      if #available(iOS 13.0, *), let qualityPrioritization = options["qualityPrioritization"] as? String {
        guard let photoQualityPrioritization = AVCapturePhotoOutput.QualityPrioritization(withString: qualityPrioritization) else {
          return promise.reject(error: .parameter(.invalid(unionName: "QualityPrioritization", receivedValue: qualityPrioritization)))
        }
        photoSettings.photoQualityPrioritization = photoQualityPrioritization
      }
      if #available(iOS 12.0, *), let autoRedEyeReduction = options["enableAutoRedEyeReduction"] as? Bool {
        photoSettings.isAutoRedEyeReductionEnabled = autoRedEyeReduction
      }
      if let enableVirtualDeviceFusion = options["enableVirtualDeviceFusion"] as? Bool {
        if #available(iOS 13.0, *) {
          photoSettings.isAutoVirtualDeviceFusionEnabled = enableVirtualDeviceFusion
        } else {
          photoSettings.isAutoDualCameraFusionEnabled = enableVirtualDeviceFusion
        }
      }
      if let enableAutoStabilization = options["enableAutoStabilization"] as? Bool {
        photoSettings.isAutoStillImageStabilizationEnabled = enableAutoStabilization
      }
      if #available(iOS 14.1, *), let enableAutoDistortionCorrection = options["enableAutoDistortionCorrection"] as? Bool {
        photoSettings.isAutoContentAwareDistortionCorrectionEnabled = enableAutoDistortionCorrection
      }

      photoOutput.capturePhoto(with: photoSettings, delegate: PhotoCaptureDelegate(promise: promise))
    }
  }
}
