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
  private var input: AVCaptureDeviceInput? = nil
  
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
    get {
      return HybridCameraFormat(format: device.activeFormat)
    }
    set {
      guard let hybridFormat = newValue as? HybridCameraFormat else {
        return
      }
      device.activeFormat = hybridFormat.format
    }
  }
  
  var activeDepthFormat: (any HybridCameraFormatSpec)? {
    get {
      guard let format = device.activeDepthDataFormat else {
        return nil
      }
      return HybridCameraFormat(format: format)
    }
    set {
      if let hybridFormat = newValue as? HybridCameraFormat {
        device.activeDepthDataFormat = hybridFormat.format
      } else {
        device.activeDepthDataFormat = nil
      }
    }
  }
  
  var enableAutoFrameRate: Bool {
    get {
      guard #available(iOS 18.0, *) else {
        return false
      }
      return device.isAutoVideoFrameRateEnabled
    }
    set {
      guard #available(iOS 18.0, *) else {
        return
      }
      device.isAutoVideoFrameRateEnabled = newValue
    }
  }
  
  var fps: Range {
    get {
      return Range(min: device.activeVideoMinFrameDuration.seconds,
                   max: device.activeVideoMaxFrameDuration.seconds)
    }
    set {
      device.activeVideoMinFrameDuration = CMTime(seconds: newValue.min, preferredTimescale: device.activeVideoMinFrameDuration.timescale)
      device.activeVideoMaxFrameDuration = CMTime(seconds: newValue.max, preferredTimescale: device.activeVideoMaxFrameDuration.timescale)
    }
  }
  
  var focusMode: FocusMode {
    get {
      return FocusMode(mode: device.focusMode)
    }
    set {
      device.focusMode = newValue.toAVCaptureDeviceFocusMode()
    }
  }
  
  var supportsSmoothAutoFocus: Bool {
    return device.isSmoothAutoFocusSupported
  }
  
  var enableSmoothAutoFocus: Bool {
    get {
      return device.isSmoothAutoFocusEnabled
    }
    set {
      device.isSmoothAutoFocusEnabled = newValue
    }
  }
  
  var enableFaceDrivenAutoFocus: Bool {
    get {
      guard #available(iOS 15.4, *) else {
        return false
      }
      return device.isFaceDrivenAutoFocusEnabled
    }
    set {
      guard #available(iOS 15.4, *) else {
        return
      }
      device.isFaceDrivenAutoFocusEnabled = newValue
    }
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
    get {
      return ExposureMode(mode: device.exposureMode)
    }
    set {
      device.exposureMode = newValue.toAVCaptureDeviceExposureMode()
    }
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
    get {
      guard #available(iOS 15.4, *) else {
        return false
      }
      return device.isFaceDrivenAutoExposureEnabled
    }
    set {
      guard #available(iOS 15.4, *) else {
        return
      }
      device.isFaceDrivenAutoExposureEnabled = newValue
    }
  }
  
  var isAdjustingExposure: Bool {
    return device.isAdjustingExposure
  }
  
  var exposureDuration: Double {
    return device.exposureDuration.seconds
  }
  
  var activeMaxExposureDuration: Double {
    get {
      return device.activeMaxExposureDuration.seconds
    }
    set {
      device.activeMaxExposureDuration = CMTime(seconds: newValue, preferredTimescale: device.activeMaxExposureDuration.timescale)
    }
  }
  
  var iso: Double {
    return Double(device.iso)
  }
  
  var lensAperture: Double {
    return Double(device.lensAperture)
  }
  
  var whiteBalanceMode: WhiteBalanceMode {
    get {
      return WhiteBalanceMode(mode: device.whiteBalanceMode)
    }
    set {
      device.whiteBalanceMode = newValue.toAVCaptureDeviceWhiteBalanceMode()
    }
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
    get {
      return device.automaticallyEnablesLowLightBoostWhenAvailable
    }
    set {
      device.automaticallyEnablesLowLightBoostWhenAvailable = newValue
    }
  }
  
  var enableVideoHDR: Bool {
    get {
      return device.isVideoHDREnabled
    }
    set {
      device.isVideoHDREnabled = newValue
    }
  }
  
  var automaticallyEnableVideoHDR: Bool {
    get {
      return device.automaticallyAdjustsVideoHDREnabled
    }
    set {
      device.automaticallyAdjustsVideoHDREnabled = newValue
    }
  }
  
  var enableGlobalToneMapping: Bool {
    get {
      return device.isGlobalToneMappingEnabled
    }
    set {
      device.isGlobalToneMappingEnabled = newValue
    }
  }
  
  var colorSpace: ColorSpace {
    get {
      return ColorSpace(color: device.activeColorSpace)
    }
    set {
      device.activeColorSpace = newValue.toAVColorSpace()
    }
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
    get {
      return device.videoZoomFactor
    }
    set {
      device.videoZoomFactor = newValue
    }
  }
  
  var isZoomingAnimation: Bool {
    return device.isRampingVideoZoom
  }
  
  var supportsDistortionCorrection: Bool {
    return device.isGeometricDistortionCorrectionSupported
  }
  
  var enableDistortionCorrection: Bool {
    get {
      return device.isGeometricDistortionCorrectionEnabled
    }
    set {
      device.isGeometricDistortionCorrectionEnabled = newValue
    }
  }
  
  func hasMediaType(mediaType: MediaType) -> Bool {
    return device.hasMediaType(mediaType.toAVMediaType())
  }
  
  func supportsFocusMode(mode: FocusMode) throws -> Bool {
    return device.isFocusModeSupported(mode.toAVCaptureDeviceFocusMode())
  }
  
  func setFocusPoint(point: Point) throws -> Promise<Void> {
    throw RuntimeError.error(withMessage: "Focusing to a point is not yet supported.")
  }
  
  func setFocusRect(rect: Rect) throws -> Promise<Void> {
    throw RuntimeError.error(withMessage: "Focusing to a rect is not yet supported.")
  }
  
  func getDefaultRectForFocusPoint(point: Point) throws -> Rect {
    guard #available(iOS 26.0, *) else {
      return .zero
    }
    let cgRect = self.device.defaultRectForFocusPoint(ofInterest: point.toCGPoint())
    return Rect(cgRect)
  }
  
  func setFocusLensPosition(lensPosition: Double) throws -> Promise<Void> {
    return Promise.async {
      self.device.setFocusModeLocked(lensPosition: Float(lensPosition))
    }
  }
  
  func supportsExposureMode(exposureMode: ExposureMode) throws -> Bool {
    return device.isExposureModeSupported(exposureMode.toAVCaptureDeviceExposureMode())
  }
  
  func setExposurePoint(point: Point) throws -> Promise<Void> {
    throw RuntimeError.error(withMessage: "Focusing exposure to a point is not yet supported.")
  }
  
  func setExposureRect(rect: Rect) throws -> Promise<Void> {
    throw RuntimeError.error(withMessage: "Focusing exposure to a rect is not yet supported.")
  }
  
  func getDefaultRectForExposurePoint(point: Point) throws -> Rect {
    guard #available(iOS 26.0, *) else {
      return .zero
    }
    let cgRect = self.device.defaultRectForExposurePoint(ofInterest: point.toCGPoint())
    return Rect(cgRect)
  }
  
  func setExposureBias(exposure: Double) throws -> Promise<Void> {
    return Promise.async {
      self.device.setExposureTargetBias(Float(exposure))
    }
  }
  
  func setExposureLocked(duration: Double, iso: Double) throws -> Promise<Void> {
    return Promise.async {
      let time = CMTime(seconds: duration, preferredTimescale: 1_000_000)
      self.device.setExposureModeCustom(duration: time, iso: Float(iso))
    }
  }
  
  func supportsWhiteBalanceMode(whiteBalanceMode: WhiteBalanceMode) throws -> Bool {
    return device.isWhiteBalanceModeSupported(whiteBalanceMode.toAVCaptureDeviceWhiteBalanceMode())
  }
  
  func setWhiteBalanceLocked(whiteBalanceGains: WhiteBalanceGains) throws -> Promise<Void> {
    return Promise.async {
      let values = AVCaptureDevice.WhiteBalanceGains(redGain: Float(whiteBalanceGains.redGain),
                                                     greenGain: Float(whiteBalanceGains.greenGain),
                                                     blueGain: Float(whiteBalanceGains.blueGain))
      self.device.setWhiteBalanceModeLocked(with: values)
    }
  }
  
  func supportsTorchMode(torch: TorchMode) throws -> Bool {
    return device.isTorchModeSupported(torch.toAVCaptureDeviceTorchMode())
  }
  
  func enableTorch(level: Double) throws -> Promise<Void> {
    return Promise.async {
      try self.device.setTorchModeOn(level: Float(level))
    }
  }
  
  func startZoomAnimation(zoom: Double, rate: Double) throws -> Promise<Void> {
    return Promise.async {
      self.device.ramp(toVideoZoomFactor: zoom, withRate: Float(rate))
    }
  }
  
  func cancelZoomAnimation() -> Promise<Void> {
    return Promise.async {
      self.device.cancelVideoZoomRamp()
    }
  }
  
  func getInput() throws -> AVCaptureDeviceInput {
    if let input = self.input {
      return input
    }
    let input = try AVCaptureDeviceInput(device: device)
    self.input = input
    return input
  }
}
