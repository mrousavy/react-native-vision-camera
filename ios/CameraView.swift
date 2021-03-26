//
//  CameraView.swift
//  Cuvent
//
//  Created by Marc Rousavy on 09.11.20.
//  Copyright © 2020 Facebook. All rights reserved.
//

// swiftlint:disable file_length

import AVFoundation
import Foundation
import UIKit

//
// TODOs for the CameraView which are currently too hard to implement either because of AVFoundation's limitations, or my brain capacity
//
// CameraView+RecordVideo
// TODO: Better startRecording()/stopRecording() (promise + callback, wait for TurboModules/JSI)
// TODO: videoStabilizationMode

// CameraView+TakePhoto
// TODO: Photo HDR

private let propsThatRequireReconfiguration = ["cameraId",
                                               "enableDepthData",
                                               "enableHighResolutionCapture",
                                               "enablePortraitEffectsMatteDelivery",
                                               "preset",
                                               "onCodeScanned",
                                               "scannableCodes"]
private let propsThatRequireDeviceReconfiguration = ["fps",
                                                     "hdr",
                                                     "lowLightBoost",
                                                     "colorSpace"]

// MARK: - CameraView

final class CameraView: UIView {
  // MARK: Lifecycle

  override init(frame: CGRect) {
    super.init(frame: frame)
    videoPreviewLayer.session = captureSession
    videoPreviewLayer.videoGravity = .resizeAspectFill
    videoPreviewLayer.frame = layer.bounds

    NotificationCenter.default.addObserver(self,
                                           selector: #selector(sessionRuntimeError),
                                           name: .AVCaptureSessionRuntimeError,
                                           object: captureSession)
    NotificationCenter.default.addObserver(self,
                                           selector: #selector(audioSessionInterrupted),
                                           name: AVAudioSession.interruptionNotification,
                                           object: AVAudioSession.sharedInstance)
  }

  deinit {
    NotificationCenter.default.removeObserver(self,
                                              name: .AVCaptureSessionRuntimeError,
                                              object: captureSession)
    NotificationCenter.default.removeObserver(self,
                                              name: AVAudioSession.interruptionNotification,
                                              object: AVAudioSession.sharedInstance)
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) is not implemented.")
  }

  // pragma MARK: Props updating
  override final func didSetProps(_ changedProps: [String]!) {
    ReactLogger.log(level: .info, message: "Updating \(changedProps.count) prop(s)...")
    let shouldReconfigure = changedProps.contains { propsThatRequireReconfiguration.contains($0) }
    let shouldReconfigureFormat = shouldReconfigure || changedProps.contains("format")
    let shouldReconfigureDevice = shouldReconfigureFormat || changedProps.contains { propsThatRequireDeviceReconfiguration.contains($0) }

    let willReconfigure = shouldReconfigure || shouldReconfigureFormat || shouldReconfigureDevice

    let shouldCheckActive = willReconfigure || changedProps.contains("isActive") || captureSession.isRunning != isActive
    let shouldUpdateTorch = willReconfigure || changedProps.contains("torch") || shouldCheckActive
    let shouldUpdateZoom = willReconfigure || changedProps.contains("zoom") || shouldCheckActive

    if shouldReconfigure || shouldCheckActive || shouldUpdateTorch || shouldUpdateZoom || shouldReconfigureFormat || shouldReconfigureDevice {
      queue.async {
        if shouldReconfigure {
          self.configureCaptureSession()
        }
        if shouldReconfigureFormat {
          self.configureFormat()
        }
        if shouldReconfigureDevice {
          self.configureDevice()
        }

        if shouldUpdateZoom {
          let zoomPercent = CGFloat(max(min(self.zoom.doubleValue, 1.0), 0.0))
          let zoomScaled = (zoomPercent * (self.maxAvailableZoom - self.minAvailableZoom)) + self.minAvailableZoom
          self.zoom(factor: zoomScaled, animated: false)
          self.pinchScaleOffset = zoomScaled
        }

        if shouldCheckActive && self.captureSession.isRunning != self.isActive {
          if self.isActive {
            ReactLogger.log(level: .info, message: "Starting Session...")
            self.configureAudioSession()
            self.captureSession.startRunning()
            ReactLogger.log(level: .info, message: "Started Session!")
          } else {
            ReactLogger.log(level: .info, message: "Stopping Session...")
            self.captureSession.stopRunning()
            ReactLogger.log(level: .info, message: "Stopped Session!")
          }
        }

        // This is a wack workaround, but if I immediately set torch mode after `startRunning()`, the session isn't quite ready yet and will ignore torch.
        self.queue.asyncAfter(deadline: .now() + 0.1) {
          if shouldUpdateTorch {
            self.setTorchMode(self.torch)
          }
        }
      }
    }
  }

  override func removeFromSuperview() {
    ReactLogger.log(level: .info, message: "Removing Camera View...")
    captureSession.stopRunning()
    super.removeFromSuperview()
  }

  // MARK: Internal

  // pragma MARK: Setup
  override class var layerClass: AnyClass {
    return AVCaptureVideoPreviewLayer.self
  }

  // pragma MARK: Exported Properties
  // props that require reconfiguring
  @objc var cameraId: NSString?
  @objc var enableDepthData = false
  @objc var enableHighResolutionCapture: NSNumber? // nullable bool
  @objc var enablePortraitEffectsMatteDelivery = false
  @objc var preset: String?
  @objc var scannableCodes: [String]?
  // props that require format reconfiguring
  @objc var format: NSDictionary?
  @objc var fps: NSNumber?
  @objc var hdr: NSNumber? // nullable bool
  @objc var lowLightBoost: NSNumber? // nullable bool
  @objc var colorSpace: NSString?
  // other props
  @objc var isActive = false
  @objc var torch = "off"
  @objc var zoom: NSNumber = 0.0 // in percent
  // events
  @objc var onInitialized: RCTDirectEventBlock?
  @objc var onError: RCTDirectEventBlock?
  @objc var onCodeScanned: RCTBubblingEventBlock?
  var isReady = false
  // pragma MARK: Private Properties
  /// The serial execution queue for the camera preview layer (input stream) as well as output processing (take photo, record video, process metadata/barcodes)
  internal let queue = DispatchQueue(label: "com.mrousavy.camera-queue", qos: .userInteractive, attributes: [], autoreleaseFrequency: .inherit, target: nil)
  internal var videoDeviceInput: AVCaptureDeviceInput?
  internal var audioDeviceInput: AVCaptureDeviceInput?
  internal var photoOutput: AVCapturePhotoOutput?
  internal var movieOutput: AVCaptureMovieFileOutput?
  internal var metadataOutput: AVCaptureMetadataOutput?
  // CameraView+TakePhoto
  internal var photoCaptureDelegates: [PhotoCaptureDelegate] = []
  // CameraView+RecordVideo
  internal var recordingDelegateResolver: RCTPromiseResolveBlock?
  internal var recordingDelegateRejecter: RCTPromiseRejectBlock?
  // CameraView+Zoom
  internal var pinchGestureRecognizer: UIPinchGestureRecognizer?
  internal var pinchScaleOffset: CGFloat = 1.0

  @objc var enableZoomGesture = false {
    didSet {
      if enableZoomGesture {
        addPinchGestureRecognizer()
      } else {
        removePinchGestureRecognizer()
      }
    }
  }

  var isRunning: Bool {
    return captureSession.isRunning
  }

  /// Convenience wrapper to get layer as its statically known type.
  var videoPreviewLayer: AVCaptureVideoPreviewLayer {
    // swiftlint:disable force_cast
    return layer as! AVCaptureVideoPreviewLayer
  }

  @objc
  func sessionRuntimeError(notification: Notification) {
    ReactLogger.log(level: .error, message: "Unexpected Camera Runtime Error occured!")
    guard let error = notification.userInfo?[AVCaptureSessionErrorKey] as? AVError else {
      return
    }

    if isActive {
      // restart capture session after an error occured
      queue.async {
        self.captureSession.startRunning()
      }
    }
    invokeOnError(.unknown(message: error.description), cause: error as NSError)
  }
  
  @objc
  func audioSessionInterrupted(notification: Notification) {
    ReactLogger.log(level: .error, message: "The Audio Session was interrupted!")
    guard let userInfo = notification.userInfo,
          let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
      return
    }
    switch type {
    case .began:
      // TODO: Should we also disable the camera here? I think it will throw a runtime error
      // disable audio session
      try? AVAudioSession.sharedInstance().setActive(false)
      break
    case .ended:
      guard let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt else { return }
      let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
      if options.contains(.shouldResume) {
        // restart audio session because interruption is over
        configureAudioSession()
      } else {
        ReactLogger.log(level: .error, message: "Cannot resume interrupted Audio Session!")
      }
      break
    }
  }

  internal final func setTorchMode(_ torchMode: String) {
    guard let device = videoDeviceInput?.device else {
      return invokeOnError(.session(.cameraNotReady))
    }
    guard var torchMode = AVCaptureDevice.TorchMode(withString: torchMode) else {
      return invokeOnError(.parameter(.invalid(unionName: "TorchMode", receivedValue: torch)))
    }
    if !captureSession.isRunning {
      torchMode = .off
    }
    if device.torchMode == torchMode {
      // no need to run the whole lock/unlock bs
      return
    }
    if !device.hasTorch || !device.isTorchAvailable {
      if torchMode == .off {
        // ignore it, when it's off and not supported, it's off.
        return
      } else {
        // torch mode is .auto or .on, but no torch is available.
        return invokeOnError(.device(.torchUnavailable))
      }
    }
    do {
      try device.lockForConfiguration()
      device.torchMode = torchMode
      if torchMode == .on {
        try device.setTorchModeOn(level: 1.0)
      }
      device.unlockForConfiguration()
    } catch let error as NSError {
      return invokeOnError(.device(.configureError), cause: error)
    }
  }

  // pragma MARK: Event Invokers
  internal final func invokeOnError(_ error: CameraError, cause: NSError? = nil) {
    ReactLogger.log(level: .error, message: "Invoking onError(): \(error.message)", alsoLogToJS: true)
    guard let onError = self.onError else { return }

    var causeDictionary: [String: Any]?
    if let cause = cause {
      causeDictionary = [
        "code": cause.code,
        "domain": cause.domain,
        "message": cause.description,
        "details": cause.userInfo,
      ]
    }
    onError([
      "code": error.code,
      "message": error.message,
      "cause": causeDictionary ?? NSNull(),
    ])
  }

  internal final func invokeOnInitialized() {
    ReactLogger.log(level: .info, message: "Camera initialized!", alsoLogToJS: true)
    guard let onInitialized = self.onInitialized else { return }
    onInitialized([String: Any]())
  }

  // MARK: Private

  private let captureSession = AVCaptureSession()

  private final func setAutomaticallyConfiguresAudioSession(_ automaticallyConfiguresAudioSession: Bool) {
    if captureSession.automaticallyConfiguresApplicationAudioSession != automaticallyConfiguresAudioSession {
      captureSession.beginConfiguration()
      captureSession.automaticallyConfiguresApplicationAudioSession = automaticallyConfiguresAudioSession
      captureSession.commitConfiguration()
    }
  }

  // pragma MARK: Session, Device and Format Configuration
  /**
   Configures the Audio session to allow background-music playback while recording.
   */
  private final func configureAudioSession() {
    let start = DispatchTime.now()
    do {
      setAutomaticallyConfiguresAudioSession(false)
      let audioSession = AVAudioSession.sharedInstance()
      if audioSession.category != .playAndRecord {
        // allow background music playback
        try audioSession.setCategory(AVAudioSession.Category.playAndRecord, options: [.mixWithOthers, .allowBluetoothA2DP, .defaultToSpeaker])
      }
      // TODO: Use https://developer.apple.com/documentation/avfaudio/avaudiosession/3726094-setprefersnointerruptionsfromsys
      audioSession.trySetAllowHaptics(true)
      // activate current audio session because camera is active
      try audioSession.setActive(true)
    } catch let error as NSError {
      self.invokeOnError(.session(.audioSessionSetupFailed(reason: error.description)), cause: error)
      setAutomaticallyConfiguresAudioSession(true)
    }
    let end = DispatchTime.now()
    let nanoTime = end.uptimeNanoseconds - start.uptimeNanoseconds
    ReactLogger.log(level: .info, message: "Configured Audio session in \(Double(nanoTime) / 1_000_000)ms!")
  }

  /**
   Configures the Capture Session.
   */
  private final func configureCaptureSession() {
    ReactLogger.logJS(level: .info, message: "Configuring Session...")
    isReady = false

    #if targetEnvironment(simulator)
      return invokeOnError(.device(.notAvailableOnSimulator))
    #endif

    guard cameraId != nil else {
      return invokeOnError(.device(.noDevice))
    }
    let cameraId = self.cameraId! as String

    ReactLogger.log(level: .info, message: "Initializing Camera with device \(cameraId)...")
    captureSession.beginConfiguration()
    defer {
      captureSession.commitConfiguration()
    }

    if let preset = self.preset {
      var sessionPreset: AVCaptureSession.Preset?
      do {
        sessionPreset = try AVCaptureSession.Preset(withString: preset)
      } catch let EnumParserError.unsupportedOS(supportedOnOS: os) {
        return invokeOnError(.parameter(.unsupportedOS(unionName: "Preset", receivedValue: preset, supportedOnOs: os)))
      } catch {
        return invokeOnError(.parameter(.invalid(unionName: "Preset", receivedValue: preset)))
      }
      if sessionPreset != nil {
        if captureSession.canSetSessionPreset(sessionPreset!) {
          captureSession.sessionPreset = sessionPreset!
        } else {
          // non-fatal error, so continue with configuration
          invokeOnError(.format(.invalidPreset(preset: preset)))
        }
      }
    }

    // INPUTS
    // Video Input
    do {
      if let videoDeviceInput = self.videoDeviceInput {
        captureSession.removeInput(videoDeviceInput)
      }
      guard let videoDevice = AVCaptureDevice(uniqueID: cameraId) else {
        return invokeOnError(.device(.invalid))
      }
      zoom = NSNumber(value: Double(videoDevice.neutralZoomPercent))
      videoDeviceInput = try AVCaptureDeviceInput(device: videoDevice)
      guard captureSession.canAddInput(videoDeviceInput!) else {
        return invokeOnError(.parameter(.unsupportedInput(inputDescriptor: "video-input")))
      }
      captureSession.addInput(videoDeviceInput!)
    } catch {
      return invokeOnError(.device(.invalid))
    }

    // Microphone (Audio Input)
    do {
      if let audioDeviceInput = self.audioDeviceInput {
        captureSession.removeInput(audioDeviceInput)
      }
      guard let audioDevice = AVCaptureDevice.default(for: .audio) else {
        return invokeOnError(.device(.microphoneUnavailable))
      }

      audioDeviceInput = try AVCaptureDeviceInput(device: audioDevice)
      guard captureSession.canAddInput(audioDeviceInput!) else {
        return invokeOnError(.parameter(.unsupportedInput(inputDescriptor: "audio-input")))
      }
      captureSession.addInput(audioDeviceInput!)
    } catch {
      return invokeOnError(.device(.invalid))
    }

    // OUTPUTS
    if let photoOutput = self.photoOutput {
      captureSession.removeOutput(photoOutput)
    }
    // Photo Output
    photoOutput = AVCapturePhotoOutput()
    photoOutput!.isDepthDataDeliveryEnabled = photoOutput!.isDepthDataDeliverySupported && enableDepthData
    if let enableHighResolutionCapture = self.enableHighResolutionCapture?.boolValue {
      photoOutput!.isHighResolutionCaptureEnabled = enableHighResolutionCapture
    }
    if #available(iOS 12.0, *) {
      photoOutput!.isPortraitEffectsMatteDeliveryEnabled = photoOutput!.isPortraitEffectsMatteDeliverySupported && self.enablePortraitEffectsMatteDelivery
    }
    guard captureSession.canAddOutput(photoOutput!) else {
      return invokeOnError(.parameter(.unsupportedOutput(outputDescriptor: "photo-output")))
    }
    captureSession.addOutput(photoOutput!)
    if videoDeviceInput!.device.position == .front {
      photoOutput!.mirror()
    }

    // Video Output
    if let movieOutput = self.movieOutput {
      captureSession.removeOutput(movieOutput)
    }
    movieOutput = AVCaptureMovieFileOutput()
    guard captureSession.canAddOutput(movieOutput!) else {
      return invokeOnError(.parameter(.unsupportedOutput(outputDescriptor: "movie-output")))
    }
    captureSession.addOutput(movieOutput!)
    if videoDeviceInput!.device.position == .front {
      movieOutput!.mirror()
    }

    // Barcode Scanning
    if let metadataOutput = self.metadataOutput {
      captureSession.removeOutput(metadataOutput)
    }
    if let scannableCodes = self.scannableCodes {
      // scannableCodes prop is not nil, so enable barcode scanning.
      guard onCodeScanned != nil else {
        return invokeOnError(.parameter(.invalidCombination(provided: "scannableCodes", missing: "onCodeScanned")))
      }
      metadataOutput = AVCaptureMetadataOutput()
      guard captureSession.canAddOutput(metadataOutput!) else {
        return invokeOnError(.parameter(.unsupportedOutput(outputDescriptor: "metadata-output")))
      }
      captureSession.addOutput(metadataOutput!)
      metadataOutput!.setMetadataObjectsDelegate(self, queue: queue)
      var objectTypes: [AVMetadataObject.ObjectType] = []
      scannableCodes.forEach { code in
        do {
          objectTypes.append(try AVMetadataObject.ObjectType(withString: code))
        } catch let EnumParserError.unsupportedOS(supportedOnOS: os) {
          invokeOnError(.parameter(.unsupportedOS(unionName: "CodeType", receivedValue: code, supportedOnOs: os)))
        } catch {
          invokeOnError(.parameter(.invalid(unionName: "CodeType", receivedValue: code)))
        }
      }
      metadataOutput!.metadataObjectTypes = objectTypes
    }

    invokeOnInitialized()
    isReady = true
    ReactLogger.logJS(level: .info, message: "Session successfully configured!")
  }

  /**
   Configures the Video Device to find the best matching Format.
   */
  private final func configureFormat() {
    ReactLogger.logJS(level: .info, message: "Configuring Format...")
    guard let filter = self.format else {
      // Format Filter was null. Ignore it.
      return
    }
    guard let device = videoDeviceInput?.device else {
      return invokeOnError(.session(.cameraNotReady))
    }

    if device.activeFormat.matchesFilter(filter) {
      ReactLogger.log(level: .info, message: "Active format already matches filter.")
      return
    }

    // get matching format
    let matchingFormats = device.formats.filter { $0.matchesFilter(filter) }.sorted { $0.isBetterThan($1) }
    guard let format = matchingFormats.first else {
      return invokeOnError(.format(.invalidFormat))
    }

    do {
      try device.lockForConfiguration()
      device.activeFormat = format
      device.unlockForConfiguration()
      ReactLogger.logJS(level: .info, message: "Format successfully configured!")
    } catch let error as NSError {
      return invokeOnError(.device(.configureError), cause: error)
    }
  }

  /**
   Configures the Video Device with the given FPS, HDR and ColorSpace.
   */
  private final func configureDevice() {
    ReactLogger.logJS(level: .info, message: "Configuring Device...")
    guard let device = videoDeviceInput?.device else {
      return invokeOnError(.session(.cameraNotReady))
    }

    do {
      try device.lockForConfiguration()

      if let fps = self.fps?.int32Value {
        let duration = CMTimeMake(value: 1, timescale: fps)
        device.activeVideoMinFrameDuration = duration
        device.activeVideoMaxFrameDuration = duration
      } else {
        device.activeVideoMinFrameDuration = CMTime.invalid
        device.activeVideoMaxFrameDuration = CMTime.invalid
      }
      if hdr != nil {
        if hdr == true && !device.activeFormat.isVideoHDRSupported {
          return invokeOnError(.format(.invalidHdr))
        }
        if !device.automaticallyAdjustsVideoHDREnabled {
          if device.isVideoHDREnabled != hdr!.boolValue {
            device.isVideoHDREnabled = hdr!.boolValue
          }
        }
      }
      if lowLightBoost != nil {
        if lowLightBoost == true && !device.isLowLightBoostSupported {
          return invokeOnError(.device(.lowLightBoostNotSupported))
        }
        if device.automaticallyEnablesLowLightBoostWhenAvailable != lowLightBoost!.boolValue {
          device.automaticallyEnablesLowLightBoostWhenAvailable = lowLightBoost!.boolValue
        }
      }
      if colorSpace != nil, let avColorSpace = try? AVCaptureColorSpace(string: String(colorSpace!)) {
        device.activeColorSpace = avColorSpace
      }

      device.unlockForConfiguration()
      ReactLogger.logJS(level: .info, message: "Device successfully configured!")
    } catch let error as NSError {
      return invokeOnError(.device(.configureError), cause: error)
    }
  }
}
