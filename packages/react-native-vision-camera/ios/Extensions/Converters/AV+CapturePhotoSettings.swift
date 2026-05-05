///
/// CapturePhotoSettings+toAVCapturePhotoSettings.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCapturePhotoSettings {
  private var isRAWFormat: Bool {
    return self.rawPhotoPixelFormatType != 0
  }
  private var isAppleProRAWFormat: Bool {
    return AVCapturePhotoOutput.isAppleProRAWPixelFormat(self.rawPhotoPixelFormatType)
  }

  var supportsQualityPrioritization: Bool {
    if isRAWFormat {
      // It's a RAW format - only Apple ProRAW supports qualityPrioritization
      return isAppleProRAWFormat
    } else {
      // It's NOT a RAW format (eg JPEG or HEIC), we can use qualityPrioritization
      return true
    }
  }
  var supportsDepthData: Bool {
    // If we shoot in RAW, we cannot enable depth data
    return !isRAWFormat
  }
  var supportsDistortionCorrection: Bool {
    // If we shoot in RAW, we cannot enable distortion correction
    return !isRAWFormat
  }
}

extension AVCapturePhotoOutput {
  var bestRawPixelFormat: OSType? {
    if self.isAppleProRAWEnabled {
      if let appleProRawFormat = self.availableRawPhotoPixelFormatTypes.first(where: {
        AVCapturePhotoOutput.isAppleProRAWPixelFormat($0)
      }) {
        // We have an Apple ProRAW format! Use that
        return appleProRawFormat
      }
    }
    // No Apple ProRAW enabled or available, just use the first available default RAW format (or nil if there is none)
    return self.availableRawPhotoPixelFormatTypes.first
  }
}

extension CapturePhotoSettings {
  private func getBaseAVCapturePhotoSettings(
    for output: AVCapturePhotoOutput,
    in containerFormat: TargetPhotoContainerFormat,
    quality: Double
  ) throws -> AVCapturePhotoSettings {
    guard quality >= 0.0 && quality <= 1.0 else {
      throw RuntimeError.error(
        withMessage:
          "Photo `quality` is not within 0.0 to 1.0 range! (Received: \(quality))")
    }

    switch containerFormat {
    case .jpeg:
      return AVCapturePhotoSettings(format: [
        AVVideoCodecKey: AVVideoCodecType.jpeg,
        AVVideoCompressionPropertiesKey: [
          AVVideoQualityKey: quality
        ],
      ])
    case .heic:
      return AVCapturePhotoSettings(format: [
        AVVideoCodecKey: AVVideoCodecType.hevc,
        AVVideoCompressionPropertiesKey: [
          AVVideoQualityKey: quality
        ],
      ])
    case .dng:
      // For RAW, we need to get the first available RAW format (often Bayer14)
      guard let rawFormat = output.bestRawPixelFormat else {
        throw RuntimeError.error(
          withMessage: "This PhotoOutput does not support raw capture (\"dng\" format)! "
            + "Select a Format that contains `dng` in its `supportedPhotoContainerFormats` to capture raw photos."
        )
      }
      return AVCapturePhotoSettings(rawPixelFormatType: rawFormat)
    case .native:
      // Apple's default processed photo format is HEIC.
      return try getBaseAVCapturePhotoSettings(for: output, in: .heic, quality: quality)
    }
  }

  /**
   * Converts this `CapturePhotoSettings` config to `AVCapturePhotoSettings`.
   * This contains some sensible defaults.
   * - Options that are supported will be applied
   * - Options that are not supported but don't directly affect results (e.g. `enableDistortionCorrection`) will be swallowed.
   * - Options that are not supported but directly affect results (e.g. `enableDepthData`) will throw.
   */
  func toAVCapturePhotoSettings(
    for output: AVCapturePhotoOutput, withOptions options: PhotoOutputOptions
  ) throws -> AVCapturePhotoSettings {
    let settings = try getBaseAVCapturePhotoSettings(
      for: output,
      in: options.containerFormat,
      quality: options.quality)

    // Shoot in max resolution
    if #available(iOS 16.0, *) {
      settings.maxPhotoDimensions = output.maxPhotoDimensions
    }

    // photoQualityPrioritization can only be set on processed photos.
    if settings.supportsQualityPrioritization {
      // qualityPrioritization is configured on the PhotoOutput itself - for simplicy.
      settings.photoQualityPrioritization = output.maxPhotoQualityPrioritization
    }

    // flashMode={...}
    if let flashMode {
      let avFlashMode = flashMode.toAVCaptureDeviceFlashMode()
      if output.supportedFlashModes.contains(avFlashMode) {
        settings.flashMode = avFlashMode
      }
    }
    // enableShutterSound={...}
    if let enableShutterSound {
      if #available(iOS 18.0, *) {
        if output.isShutterSoundSuppressionSupported {
          settings.isShutterSoundSuppressionEnabled = !enableShutterSound
        }
      }
    }
    // enableDepthData={...}
    if let enableDepthData {
      // TODO: This is probably broken since we need to set `output.enableDepthDataDelivery` first,
      //       at init or configuration time (configure(...)), not at each capture.
      guard settings.supportsDepthData else {
        throw RuntimeError.error(
          withMessage:
            "Depth Data is only available in processed photo formats such as JPEG or HEIC - not in RAW/DNG!"
        )
      }
      if enableDepthData && !output.isDepthDataDeliverySupported {
        throw RuntimeError.error(
          withMessage: "`enableDepthData` is not supported on this PhotoOutput!")
      }
      settings.isDepthDataDeliveryEnabled = enableDepthData
      settings.embedsDepthDataInPhoto = enableDepthData
    }
    // enableCameraCalibrationDataDelivery={...}
    if let enableCameraCalibrationDataDelivery {
      if enableCameraCalibrationDataDelivery && !output.isCameraCalibrationDataDeliverySupported {
        throw RuntimeError.error(
          withMessage: "`enableCameraCalibrationDataDelivery` is not supported on this PhotoOutput!"
        )
      }
      settings.isCameraCalibrationDataDeliveryEnabled = enableCameraCalibrationDataDelivery
    }
    // enableRedEyeReduction={...}
    if let enableRedEyeReduction {
      if output.isAutoRedEyeReductionSupported {
        settings.isAutoRedEyeReductionEnabled = enableRedEyeReduction
      }
    }
    // enableDistortionCorrection={...}
    if let enableDistortionCorrection {
      if settings.supportsDistortionCorrection && output.isContentAwareDistortionCorrectionSupported {
        settings.isAutoContentAwareDistortionCorrectionEnabled = enableDistortionCorrection
      }
    }
    // enableVirtualDeviceFusion={...}
    if let enableVirtualDeviceFusion {
      if output.isVirtualDeviceFusionSupported {
        settings.isAutoVirtualDeviceFusionEnabled = enableVirtualDeviceFusion
      }
    }
    // previewPhotoTargetSize={...}
    if let previewImageTargetSize = options.previewImageTargetSize {
      // Preview image requested - choose default format
      if let previewFormat = settings.availablePreviewPhotoPixelFormatTypes.first {
        settings.previewPhotoFormat = [
          kCVPixelBufferPixelFormatTypeKey as String: previewFormat,
          kCVPixelBufferWidthKey as String: Int(previewImageTargetSize.width),
          kCVPixelBufferHeightKey as String: Int(previewImageTargetSize.height),
        ]
      }
    }
    // metadata
    settings.addLibraryMetadataTag()
    if let location {
      guard let location = location as? any NativeLocation else {
        throw RuntimeError.error(withMessage: "Location is not of type `NativeLocation`!")
      }
      settings.addLocationMetadataTag(location)
    }

    return settings
  }
}

extension AVCapturePhotoSettings {
  fileprivate func addLibraryMetadataTag() {
    var metadataCopy = metadata
    var tiff = metadataCopy[kCGImagePropertyTIFFDictionary as String] as? [String: Any] ?? [:]
    tiff[kCGImagePropertyTIFFSoftware as String] = "VisionCamera"
    metadataCopy[kCGImagePropertyTIFFDictionary as String] = tiff
    self.metadata = metadataCopy
  }
  fileprivate func addLocationMetadataTag(_ location: NativeLocation) {
    var metadataCopy = metadata
    let gps = location.location.toEXIF()
    metadataCopy[kCGImagePropertyGPSDictionary as String] = gps
    self.metadata = metadataCopy
  }
}
