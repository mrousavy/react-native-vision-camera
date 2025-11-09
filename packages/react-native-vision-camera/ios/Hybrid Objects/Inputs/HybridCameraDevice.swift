///
/// HybridCameraDevice.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraDevice: HybridCameraDeviceSpec {
  let device: AVCaptureDevice
  let formats: [any HybridCameraFormatSpec]

  init(device: AVCaptureDevice) {
    self.device = device
    self.formats = device.formats.map { HybridCameraFormat(format: $0) }
  }

  var id: String {
    return device.uniqueID
  }

  var modelID: String {
    return device.modelID
  }

  var localizedName: String {
    return device.localizedName
  }

  var manufacturer: String {
    return device.manufacturer
  }

  var type: DeviceType {
    do {
      return try DeviceType(type: device.deviceType)
    } catch let error {
      print("Failed to convert DeviceType! \(error)")
      return .external
    }
  }

  var position: CameraPosition {
    return CameraPosition(position: device.position)
  }

  var constituentDevices: [any HybridCameraDeviceSpec] {
    return device.constituentDevices.map { HybridCameraDevice(device: $0) }
  }

  var isConnected: Bool {
    return device.isConnected
  }

  var isSuspended: Bool {
    return device.isSuspended
  }

  var isUsedByAnotherApp: Bool {
    #if os(macOS)
    return device.isInUseByAnotherApplication
    #else
    return false
    #endif
  }

  var isVirtualDevice: Bool {
    return device.isVirtualDevice
  }

  var focalLength: Double? {
    guard #available(iOS 26.0, *) else {
      return nil
    }
    return Double(device.nominalFocalLengthIn35mmFilm)
  }

  var isContinuityCamera: Bool {
    guard #available(iOS 16.0, *) else {
      return false
    }
    return device.isContinuityCamera
  }

  var companionDeskViewCamera: (any HybridCameraDeviceSpec)? {
    guard #available(iOS 16.0, *) else {
      return nil
    }
    guard let companion = device.companionDeskViewCamera else {
      return nil
    }
    return HybridCameraDevice(device: companion)
  }

  var activeFormat: any HybridCameraFormatSpec {
    return HybridCameraFormat(format: device.activeFormat)
  }

  var activeDepthFormat: (any HybridCameraFormatSpec)? {
    guard let format = device.activeDepthDataFormat else {
      return nil
    }
    return HybridCameraFormat(format: format)
  }

  var enableAutoFrameRate: Bool {
    guard #available(iOS 18.0, *) else {
      return false
    }
    return device.isAutoVideoFrameRateEnabled
  }

  var fps: Range {
    return Range(min: device.activeVideoMinFrameDuration.seconds,
                  max: device.activeVideoMaxFrameDuration.seconds)
  }

  var focusMode: FocusMode {
    return FocusMode(mode: device.focusMode)
  }

  var supportsSmoothAutoFocus: Bool {
    return device.isSmoothAutoFocusSupported
  }

  var enableSmoothAutoFocus: Bool {
    return device.isSmoothAutoFocusEnabled
  }

  var enableFaceDrivenAutoFocus: Bool {
    guard #available(iOS 15.4, *) else {
      return false
    }
    return device.isFaceDrivenAutoFocusEnabled
  }

  var supportsFocusingPoint: Bool {
    return device.isFocusPointOfInterestSupported
  }

  var supportsFocusingRect: Bool {
    guard #available(iOS 26.0, *) else {
      return false
    }
    return device.isFocusRectOfInterestSupported
  }

  var minFocusRectSize: Size? {
    guard #available(iOS 26.0, *) else {
      return nil
    }
    return Size(width: device.minFocusRectOfInterestSize.width,
                height: device.minFocusRectOfInterestSize.height)
  }

  var isAdjustingFocus: Bool {
    return device.isAdjustingFocus
  }

  var supportsLockingFocusLensPosition: Bool {
    return device.isLockingFocusWithCustomLensPositionSupported
  }

  var lensPosition: Double {
    return Double(device.lensPosition)
  }

  var exposureMode: ExposureMode {
    return ExposureMode(mode: device.exposureMode)
  }

  var supportsExposurePoint: Bool {
    return device.isExposurePointOfInterestSupported
  }

  var supportsExposureRect: Bool {
    guard #available(iOS 26.0, *) else {
      return false
    }
    return device.isExposureRectOfInterestSupported
  }

  var minExposureRectSize: Size? {
    guard #available(iOS 26.0, *) else {
      return nil
    }
    return Size(width: device.minExposureRectOfInterestSize.width,
                height: device.minExposureRectOfInterestSize.height)
  }

  var enableFaceDrivenAutoExposure: Bool {
    guard #available(iOS 15.4, *) else {
      return false
    }
    return device.isFaceDrivenAutoExposureEnabled
  }

  var isAdjustingExposure: Bool {
    return device.isAdjustingExposure
  }

  var exposureDuration: Double {
    return device.exposureDuration.seconds
  }

  var activeMaxExposureDuration: Double {
    return device.activeMaxExposureDuration.seconds
  }

  var iso: Double {
    return Double(device.iso)
  }

  var lensAperture: Double {
    return Double(device.lensAperture)
  }

  var whiteBalanceMode: WhiteBalanceMode {
    return WhiteBalanceMode(mode: device.whiteBalanceMode)
  }

  var isAdjustingWhiteBalance: Bool {
    return device.isAdjustingWhiteBalance
  }

  var supportsLockingWhiteBalanceGains: Bool {
    return device.isLockingWhiteBalanceWithCustomDeviceGainsSupported
  }

  var hasFlash: Bool {
    return device.hasFlash
  }

  var isFlashReady: Bool {
    return device.isFlashAvailable
  }

  var hasTorch: Bool {
    return device.hasTorch
  }

  var isTorchReady: Bool {
    return device.isTorchAvailable
  }

  var torchLevel: Double {
    return Double(device.torchLevel)
  }

  var torchMode: TorchMode {
    return TorchMode(mode: device.torchMode)
  }

  var supportsLowLightBoost: Bool {
    return device.isLowLightBoostSupported
  }

  var isLowLightBoostEnabled: Bool {
    return device.isLowLightBoostEnabled
  }

  var automaticallyEnableLowLightBoost: Bool {
    return device.automaticallyEnablesLowLightBoostWhenAvailable
  }

  var enableVideoHDR: Bool {
    return device.isVideoHDREnabled
  }

  var automaticallyEnableVideoHDR: Bool {
    return device.automaticallyAdjustsVideoHDREnabled
  }

  var enableGlobalToneMapping: Bool {
    return device.isGlobalToneMappingEnabled
  }

  var colorSpace: ColorSpace {
    return ColorSpace(color: device.activeColorSpace)
  }

  var minZoom: Double {
    return device.minAvailableVideoZoomFactor
  }

  var maxZoom: Double {
    return device.maxAvailableVideoZoomFactor
  }

  var zoomLensSwitchFactors: [Double] {
    return device.virtualDeviceSwitchOverVideoZoomFactors.map { $0.doubleValue }
  }

  var displayVideoZoomFactorMultiplier: Double {
    guard #available(iOS 18.0, *) else {
      return 1.0
    }
    return device.displayVideoZoomFactorMultiplier
  }

  var zoom: Double {
    return device.videoZoomFactor
  }

  var isZoomingAnimation: Bool {
    return device.isRampingVideoZoom
  }

  var supportsDistortionCorrection: Bool {
    return device.isGeometricDistortionCorrectionSupported
  }

  var enableDistortionCorrection: Bool {
    return device.isGeometricDistortionCorrectionEnabled
  }

  func hasMediaType(mediaType: MediaType) -> Bool {
    return device.hasMediaType(mediaType.toAVMediaType())
  }

  func supportsFocusMode(mode: FocusMode) throws -> Bool {
    return device.isFocusModeSupported(mode.toAVCaptureDeviceFocusMode())
  }

  func getDefaultRectForFocusPoint(point: Point) throws -> Rect {
    guard #available(iOS 26.0, *) else {
      return .zero
    }
    let cgRect = self.device.defaultRectForFocusPoint(ofInterest: point.toCGPoint())
    return Rect(cgRect)
  }

  func supportsExposureMode(exposureMode: ExposureMode) throws -> Bool {
    return device.isExposureModeSupported(exposureMode.toAVCaptureDeviceExposureMode())
  }

  func getDefaultRectForExposurePoint(point: Point) throws -> Rect {
    guard #available(iOS 26.0, *) else {
      return .zero
    }
    let cgRect = self.device.defaultRectForExposurePoint(ofInterest: point.toCGPoint())
    return Rect(cgRect)
  }

  func supportsWhiteBalanceMode(whiteBalanceMode: WhiteBalanceMode) throws -> Bool {
    return device.isWhiteBalanceModeSupported(whiteBalanceMode.toAVCaptureDeviceWhiteBalanceMode())
  }

  func supportsTorchMode(torch: TorchMode) throws -> Bool {
    return device.isTorchModeSupported(torch.toAVCaptureDeviceTorchMode())
  }
}
