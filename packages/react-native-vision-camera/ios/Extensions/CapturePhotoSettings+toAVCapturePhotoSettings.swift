///
/// CapturePhotoSettings+toAVCapturePhotoSettings.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension CapturePhotoSettings {
  func toAVCapturePhotoSettings() -> AVCapturePhotoSettings {
    let settings = AVCapturePhotoSettings()

    if let flashMode {
      settings.flashMode = flashMode.toAVCaptureDeviceFlashMode()
    }
    if let qualityPrioritization {
      settings.photoQualityPrioritization = qualityPrioritization.toAVCapturePhotoOutputQualityPrioritization()
    }
    if let enableDepthData {
      // TODO: Split this into separate settings
      settings.isDepthDataDeliveryEnabled = enableDepthData
      settings.embedsDepthDataInPhoto = enableDepthData
    }
    if let isAutoRedEyeReductionEnabled {
      settings.isAutoRedEyeReductionEnabled = isAutoRedEyeReductionEnabled
    }
    if let isCameraCalibrationDataDeliveryEnabled {
      settings.isCameraCalibrationDataDeliveryEnabled = isCameraCalibrationDataDeliveryEnabled
    }
    if let isAutoContentAwareDistortionCorrectionEnabled {
      settings.isAutoContentAwareDistortionCorrectionEnabled = isAutoContentAwareDistortionCorrectionEnabled
    }
    if let isAutoVirtualDeviceFusionEnabled {
      settings.isAutoVirtualDeviceFusionEnabled = isAutoVirtualDeviceFusionEnabled
    }
    
    return settings
  }
}
