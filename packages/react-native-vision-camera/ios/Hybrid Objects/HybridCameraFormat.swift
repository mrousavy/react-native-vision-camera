///
/// HybridCameraFormat.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraFormat: HybridCameraFormatSpec {
  let format: AVCaptureDevice.Format
  
  init(format: AVCaptureDevice.Format) {
    self.format = format
  }
  
  var photoResolution: Resolution {
    if #available(iOS 16.0, *) {
      let maxResolution = format.supportedMaxPhotoDimensions.max { left, right in
        return (left.width * left.height) > (right.width * right.height)
      }
      if let maxResolution {
        return Resolution(dimensions: maxResolution)
      }
    }
    return Resolution(dimensions: format.highResolutionStillImageDimensions)
  }
  
  var videoResolution: Resolution {
    let dimensions = format.formatDescription.dimensions
    return Resolution(dimensions: dimensions)
  }
  
  var supportedPhotoResolutions: [Resolution] {
    guard #available(iOS 16.0, *) else {
      return [photoResolution]
    }
    return format.supportedMaxPhotoDimensions.map { Resolution(dimensions: $0) }
  }
  
  var supportsHighQualityPhoto: Bool {
    return format.isHighPhotoQualitySupported
  }
  
  var isHighestPhotoFormat: Bool {
    return format.isHighestPhotoQualitySupported
  }
  
  var supportsAutoFps: Bool {
    guard #available(iOS 18.0, *) else {
      return false
    }
    return format.isAutoVideoFrameRateSupported
  }
  
  var supportedFrameRateRanges: [Range] {
    return format.videoSupportedFrameRateRanges.map { Range(range: $0) }
  }
  
  var isVideoBinned: Bool {
    return format.isVideoBinned
  }
  
  var supportsVideoHDR: Bool {
    return format.isVideoHDRSupported
  }
  
  var supportsMultiCam: Bool {
    return format.isMultiCamSupported
  }
  
  var fieldOfView: Double {
    return Double(format.videoFieldOfView)
  }
  
  var fieldOfViewDistortionCorrected: Double {
    return Double(format.geometricDistortionCorrectedVideoFieldOfView)
  }
  
  var supportsBackgroundReplacement: Bool {
    guard #available(iOS 18.0, *) else {
      return false
    }
    return format.isBackgroundReplacementSupported
  }
  
  var frameRateRangeForBackgroundReplacement: Range? {
    guard #available(iOS 18.0, *) else {
      return nil
    }
    guard let range = format.videoFrameRateRangeForBackgroundReplacement else {
      return nil
    }
    return Range(range: range)
  }
  
  var supportsReactionEffects: Bool {
    guard #available(iOS 17.0, *) else {
      return false
    }
    return format.reactionEffectsSupported
  }
  
  var frameRateRangeForReactionEffects: Range? {
    guard #available(iOS 17.0, *) else {
      return nil
    }
    guard let range = format.videoFrameRateRangeForReactionEffectsInProgress else {
      return nil
    }
    return Range(range: range)
  }
  
  var mediaType: MediaType {
    return MediaType(type: format.mediaType)
  }
  
  var autoFocusSystem: AutoFocusSystem {
    return AutoFocusSystem(af: format.autoFocusSystem)
  }
  
  var supportsGlobalToneMapping: Bool {
    return format.isGlobalToneMappingSupported
  }
  
  var supportedColorSpaces: [ColorSpace] {
    return format.supportedColorSpaces.map { ColorSpace(color: $0) }
  }
  
  var maxZoomFactor: Double {
    return format.videoMaxZoomFactor
  }
  
  var zoomFactorUpscaleThreshold: Double {
    return format.videoZoomFactorUpscaleThreshold
  }
  
  var secondaryNativeResolutionZoomFactory: [Double] {
    guard #available(iOS 16.0, *) else {
      return []
    }
    return format.secondaryNativeResolutionZoomFactors.map { Double($0) }
  }
  
  var recommendedZoomRange: Range? {
    guard #available (iOS 18.0, *) else {
      return nil
    }
    guard let range = format.systemRecommendedVideoZoomRange else {
      return nil
    }
    return Range(range: range)
  }
  
  var minISO: Double {
    return Double(format.minISO)
  }
  
  var maxISO: Double {
    return Double(format.maxISO)
  }
  
  var minExposureDuration: Double {
    return format.minExposureDuration.seconds
  }
  
  var maxExposureDuration: Double {
    return format.maxExposureDuration.seconds
  }
  
  var recommendedExposureRange: Range? {
    guard #available (iOS 18.0, *) else {
      return nil
    }
    guard let range = format.systemRecommendedExposureBiasRange else {
      return nil
    }
    return Range(range: range)
  }
  
  var depthDataFormats: [any HybridCameraFormatSpec] {
    return format.supportedDepthDataFormats.map { HybridCameraFormat(format: $0) }
  }
  
  var supportedZoomRangesForDepthDataDelivery: [Range] {
    guard #available (iOS 17.2, *) else {
      return []
    }
    return format.supportedVideoZoomRangesForDepthDataDelivery.map { Range(range: $0) }
  }
  
  var supportsSmartFraming: Bool {
    return format.isSmartFramingSupported
  }
  
  var supportsCenterStage: Bool {
    return format.isCenterStageSupported
  }
  
  var frameRateRangeForCenterStage: Range? {
    guard let range = format.videoFrameRateRangeForCenterStage else {
      return nil
    }
    return Range(range: range)
  }
  
  var zoomRangeForCenterStage: Range? {
    return Range(min: format.videoMinZoomFactorForCenterStage,
                 max: format.videoMaxZoomFactorForCenterStage)
  }
  
  var supportsPortraitEffect: Bool {
    return format.isPortraitEffectSupported
  }
  
  var supportsPortraitEffectMatteStillImageDelivery: Bool {
    return format.isPortraitEffectsMatteStillImageDeliverySupported
  }
  
  var frameRateRangeForPortraitEffect: Range? {
    guard let range = format.videoFrameRateRangeForPortraitEffect else {
      return nil
    }
    return Range(range: range)
  }
  
  var supportsStudioLight: Bool {
    guard #available(iOS 16.0, *) else {
      return false
    }
    return format.isStudioLightSupported
  }
  
  var frameRateRangeForStudioLight: Range? {
    guard #available(iOS 16.0, *) else {
      return nil
    }
    guard let range = format.videoFrameRateRangeForStudioLight else {
      return nil
    }
    return Range(range: range)
  }
  
  var supportsCinematicVideo: Bool {
    guard #available(iOS 26.0, *) else {
      return false
    }
    return format.isCinematicVideoCaptureSupported
  }
  
  var defaultSimulatedAperture: Double? {
    guard #available(iOS 26.0, *) else {
      return nil
    }
    return Double(format.defaultSimulatedAperture)
  }
  
  var simulatedApertureRange: Range? {
    guard #available(iOS 26.0, *) else {
      return nil
    }
    return Range(min: format.minSimulatedAperture,
                 max: format.maxSimulatedAperture)
  }
  
  var zoomFactorForCinematicVideo: Range? {
    guard #available(iOS 26.0, *) else {
      return nil
    }
    return Range(min: format.videoMinZoomFactorForCinematicVideo,
                 max: format.videoMaxZoomFactorForCinematicVideo)
  }
  
  var frameRateRangeForCinematicVideo: Range? {
    guard #available(iOS 26.0, *) else {
      return nil
    }
    guard let range = format.videoFrameRateRangeForCinematicVideo else {
      return nil
    }
    return Range(range: range)
  }
  
  func supportsVideoStabilizationMode(mode: VideoStabilizationMode) -> Bool {
    return format.isVideoStabilizationModeSupported(mode.toAVCaptureVideoStabilizationMode())
  }
}
