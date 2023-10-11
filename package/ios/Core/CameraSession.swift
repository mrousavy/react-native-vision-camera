//
//  CameraSession.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import Foundation
import AVFoundation

/**
 A fully-featured Camera Session supporting preview, video, photo, frame processing, and code scanning outputs.
 All changes to the session have to be controlled via the `configure` function.
 */
class CameraSession: NSObject {
  // Configuration
  var configuration: CameraConfiguration?
  // Capture Session
  internal let captureSession = AVCaptureSession()
  internal let audioCaptureSession = AVCaptureSession()
  // Inputs & Outputs
  internal var videoDeviceInput: AVCaptureDeviceInput?
  internal var audioDeviceInput: AVCaptureDeviceInput?
  internal var photoOutput: AVCapturePhotoOutput?
  internal var videoOutput: AVCaptureVideoDataOutput?
  internal var audioOutput: AVCaptureAudioDataOutput?
  internal var codeScannerOutput: AVCaptureMetadataOutput?
  // State
  internal var recordingSession: RecordingSession?
  internal var isRecording: Bool = false
  
  // Callbacks
  private let onError: (_ error: CameraError) -> Void
  private let onInitialized: () -> Void
  
  /**
   Create a new instance of the `CameraSession`.
   The `onError` callback is used for any runtime errors.
   */
  init(onError: @escaping (_ error: CameraError) -> Void,
       onInitialized: @escaping () -> Void) {
    self.onError = onError
    self.onInitialized = onInitialized
  }
  
  /**
   Update the session configuration.
   Any changes in here will be re-configured only if required, and under a lock.
   */
  func configure(_ lambda: (_ configuration: CameraConfiguration) -> Void) {
    ReactLogger.log(level: .info, message: "Updating Session Configuration...")
    
    // Let caller configure a new configuration for the Camera
    let config = CameraConfiguration()
    lambda(config)
    
    CameraQueues.cameraQueue.async {
      do {
        if config.isDirty {
          // Lock Capture Session for configuration
          ReactLogger.log(level: .info, message: "Beginning CameraSession configuration...")
          self.captureSession.beginConfiguration()
          
          // 1. Update input device
          if config.requiresDeviceConfiguration {
            try self.configureDevice(configuration: config)
          }
          // 2. Update outputs
          if config.requiresOutputsConfiguration {
            try self.configureOutputs(configuration: config)
          }
          // 3. Configure format
          if config.requiresFormatConfiguration {
            try self.configureFormat(configuration: config)
          }
          // 4. Configure side-props (fps, lowLightBoost)
          if config.requiresSidePropsConfiguration {
            try self.configureSideProps(configuration: config)
          }
          // 5. Configure zoom
          if config.requiresZoomConfiguration {
            try self.configureZoom(configuration: config)
          }
          
          // Unlock Capture Session again and submit configuration to Hardware
          self.captureSession.commitConfiguration()
          ReactLogger.log(level: .info, message: "Committed CameraSession configuration!")
        }
        
        // 6. Start or stop the session if needed
        if config.requiresRunningCheck {
          try self.checkIsActive(configuration: config)
        }
        
        // Update successful, set the new configuration!
        self.configuration = config
      } catch (let error) {
        if let error = error as? CameraError {
          // It's a typed Error
          self.onError(error)
        } else {
          // It's any kind of unknown error
          let cameraError = CameraError.unknown(message: error.localizedDescription)
          self.onError(cameraError)
        }
      }
    }
  }
  
  // pragma MARK: Session Configuration
  
  /**
   Configures the Input Device (`cameraId`)
   */
  private func configureDevice(configuration: CameraConfiguration) throws {
    ReactLogger.log(level: .info, message: "Configuring Input Device...")
    
#if targetEnvironment(simulator)
    // iOS Simulators don't have Cameras
    throw CameraError.device(.notAvailableOnSimulator)
#endif
    
    guard let cameraId = configuration.cameraId else {
      throw CameraError.device(.noDevice)
    }
    
    ReactLogger.log(level: .info, message: "Configuring Camera \(cameraId)...")
    // Video Input
    if let videoDeviceInput = videoDeviceInput {
      captureSession.removeInput(videoDeviceInput)
      self.videoDeviceInput = nil
    }
    guard let videoDevice = AVCaptureDevice(uniqueID: cameraId) else {
      throw CameraError.device(.invalid)
    }
    videoDeviceInput = try AVCaptureDeviceInput(device: videoDevice)
    guard captureSession.canAddInput(videoDeviceInput!) else {
      throw CameraError.parameter(.unsupportedInput(inputDescriptor: "video-input"))
    }
    captureSession.addInput(videoDeviceInput!)
    
    ReactLogger.log(level: .info, message: "Successfully configured Input Device!")
  }
  
  /**
   Configures all outputs (`photo` + `video` + `codeScanner`)
   */
  private func configureOutputs(configuration: CameraConfiguration) throws {
    ReactLogger.log(level: .info, message: "Configuring Outputs...")
    
    // Remove all outputs
    captureSession.outputs.forEach { output in
      captureSession.removeOutput(output)
    }
    self.photoOutput = nil
    self.videoOutput = nil
    self.audioOutput = nil
    self.codeScannerOutput = nil
    
    // Photo Output
    if case let .enabled(photo) = configuration.photo {
      ReactLogger.log(level: .info, message: "Adding Photo output...")
      let photoOutput = AVCapturePhotoOutput()

      // 1. Configure
      if photo.enableHighQualityPhotos {
        // TODO: In iOS 16 this will be removed in favor of maxPhotoDimensions.
        photoOutput.isHighResolutionCaptureEnabled = true
        if #available(iOS 13.0, *) {
          // TODO: Test if this actually does any fusion or if this just calls the captureOutput twice. If the latter, remove it.
          photoOutput.isVirtualDeviceConstituentPhotoDeliveryEnabled = photoOutput.isVirtualDeviceConstituentPhotoDeliverySupported
          photoOutput.maxPhotoQualityPrioritization = .quality
        } else {
          photoOutput.isDualCameraDualPhotoDeliveryEnabled = photoOutput.isDualCameraDualPhotoDeliverySupported
        }
      }
      // TODO: Enable isResponsiveCaptureEnabled? (iOS 17+)
      // TODO: Enable isFastCapturePrioritizationEnabled? (iOS 17+)
      if photo.enableDepthData {
        photoOutput.isDepthDataDeliveryEnabled = photoOutput.isDepthDataDeliverySupported
      }
      if #available(iOS 12.0, *), photo.enablePortraitEffectsMatte {
        photoOutput.isPortraitEffectsMatteDeliveryEnabled = photoOutput.isPortraitEffectsMatteDeliverySupported
      }
      
      // 2. Add
      guard captureSession.canAddOutput(photoOutput) else {
        throw CameraError.parameter(.unsupportedOutput(outputDescriptor: "photo-output"))
      }
      captureSession.addOutput(photoOutput)
      self.photoOutput = photoOutput
    }

    // Video Output + Frame Processor
    if case let .enabled(video) = configuration.video {
      ReactLogger.log(level: .info, message: "Adding Video Data output...")
      let videoOutput = AVCaptureVideoDataOutput()
      
      // 1. Configure
      videoOutput.setSampleBufferDelegate(self, queue: CameraQueues.videoQueue)
      videoOutput.alwaysDiscardsLateVideoFrames = false
      let pixelFormatType = try configuration.getPixelFormat(videoOutput: videoOutput)
      videoOutput.videoSettings = [
        String(kCVPixelBufferPixelFormatTypeKey): pixelFormatType,
      ]
      
      // 2. Add
      guard captureSession.canAddOutput(videoOutput) else {
        throw CameraError.parameter(.unsupportedOutput(outputDescriptor: "video-output"))
      }
      captureSession.addOutput(videoOutput)
      self.videoOutput = videoOutput
    }

    // Code Scanner
    if case let .enabled(codeScanner) = configuration.codeScanner {
      ReactLogger.log(level: .info, message: "Adding Code Scanner output...")
      let codeScannerOutput = AVCaptureMetadataOutput()
      
      // 1. Configure
      try codeScanner.codeTypes.forEach { type in
        if !codeScannerOutput.availableMetadataObjectTypes.contains(type) {
          throw CameraError.codeScanner(.codeTypeNotSupported(codeType: type.descriptor))
        }
      }
      codeScannerOutput.setMetadataObjectsDelegate(self, queue: CameraQueues.codeScannerQueue)
      codeScannerOutput.metadataObjectTypes = codeScanner.codeTypes
      if let rectOfInterest = codeScanner.regionOfInterest {
        codeScannerOutput.rectOfInterest = rectOfInterest
      }
      
      // 2. Add
      guard captureSession.canAddOutput(codeScannerOutput) else {
        throw CameraError.codeScanner(.notCompatibleWithOutputs)
      }
      captureSession.addOutput(codeScannerOutput)
      self.codeScannerOutput = codeScannerOutput
    }
    
    // If front camera, mirror all outputs
    if videoDeviceInput?.device.position == .front {
      captureSession.outputs.forEach { output in
        output.mirror()
      }
    }
    
    // Done!
    ReactLogger.log(level: .info, message: "Successfully configured all outputs!")
    onInitialized()
  }
  
  /**
   Configures the active format (`format`)
   */
  private func configureFormat(configuration: CameraConfiguration) throws {
    guard let jsFormat = configuration.format else {
      // No format was set, just use the default.
      return
    }
    
    ReactLogger.log(level: .info, message: "Configuring Format (\(jsFormat))...")
    guard let device = videoDeviceInput?.device else {
      throw CameraError.session(.cameraNotReady)
    }

    if device.activeFormat.isEqualTo(jsFormat: jsFormat) {
      ReactLogger.log(level: .info, message: "Already selected active format.")
      return
    }

    // Find matching format (JS Dictionary -> strongly typed Swift class)
    let format = device.formats.first { $0.isEqualTo(jsFormat: jsFormat) }
    guard let format else {
      throw CameraError.format(.invalidFormat)
    }

    let shouldReconfigurePhotoOutput = device.activeFormat.photoDimensions.toCGSize() != format.photoDimensions.toCGSize()
    
    // Set new device Format
    device.activeFormat = format

    // The Photo Output uses the smallest available Dimension by default. We need to configure it for the maximum here
    if shouldReconfigurePhotoOutput, #available(iOS 16.0, *) {
      if let photoOutput = photoOutput {
        let currentMax = photoOutput.maxPhotoDimensions
        let currW = currentMax.width
        let currH = currentMax.height
        ReactLogger.log(level: .warning, message: "Current: \(currW) x \(currH) | Next: \(format.photoDimensions.width) x \(format.photoDimensions.height)")
        
        photoOutput.maxPhotoDimensions = format.photoDimensions
      }
    }

    ReactLogger.log(level: .info, message: "Successfully configured Format!")
  }
  
  /**
   Configures format-dependant "side-props" (`fps`, `lowLightBoost`)
   */
  private func configureSideProps(configuration: CameraConfiguration) throws {
    guard let device = videoDeviceInput?.device else {
      throw CameraError.session(.cameraNotReady)
    }
    
    // Configure FPS
    if let fps = configuration.fps {
      let supportsGivenFps = device.activeFormat.videoSupportedFrameRateRanges.contains { range in
        return range.includes(fps: Double(fps))
      }
      if !supportsGivenFps {
        throw CameraError.format(.invalidFps(fps: Int(fps)))
      }

      let duration = CMTimeMake(value: 1, timescale: fps)
      device.activeVideoMinFrameDuration = duration
      device.activeVideoMaxFrameDuration = duration
    } else {
      device.activeVideoMinFrameDuration = CMTime.invalid
      device.activeVideoMaxFrameDuration = CMTime.invalid
    }

    // Configure Low-Light-Boost
    if configuration.enableLowLightBoost {
      let isDifferent = configuration.enableLowLightBoost != device.automaticallyEnablesLowLightBoostWhenAvailable
      if isDifferent && !device.isLowLightBoostSupported {
        throw CameraError.device(.lowLightBoostNotSupported)
      }
      device.automaticallyEnablesLowLightBoostWhenAvailable = configuration.enableLowLightBoost
    }
  }
  
  /**
   Configures zoom (`zoom`)
   */
  private func configureZoom(configuration: CameraConfiguration) throws {
    guard let device = videoDeviceInput?.device else {
      throw CameraError.session(.cameraNotReady)
    }
    guard let zoom = configuration.zoom else {
      return
    }
    
    let clamped = max(min(zoom, device.activeFormat.videoMaxZoomFactor), CGFloat(1.0))
    device.videoZoomFactor = clamped
  }
  
  /**
   Starts or stops the CaptureSession if needed (`isActive`)
   */
  private func checkIsActive(configuration: CameraConfiguration) throws {
    if configuration.isActive == captureSession.isRunning {
      return
    }
    
    // Start/Stop session
    if configuration.isActive {
      captureSession.startRunning()
    } else {
      captureSession.stopRunning()
    }
  }
  
  
  // pragma MARK: Notifications
  
  @objc
  func sessionRuntimeError(notification: Notification) {
    ReactLogger.log(level: .error, message: "Unexpected Camera Runtime Error occured!")
    guard let error = notification.userInfo?[AVCaptureSessionErrorKey] as? AVError else {
      return
    }
    
    // Notify consumer about runtime error
    onError(.unknown(message: error._nsError.description, cause: error._nsError))

    let shouldRestart = configuration?.isActive == true
    if shouldRestart {
      // restart capture session after an error occured
      CameraQueues.cameraQueue.async {
        self.captureSession.startRunning()
      }
    }
  }
}
