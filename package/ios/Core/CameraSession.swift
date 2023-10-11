//
//  CameraSession.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import Foundation
import AVFoundation

class CameraSession {
  // Configuration
  var configuration: CameraConfiguration? = nil
  // Capture Session
  private let captureSession = AVCaptureSession()
  private let audioCaptureSession = AVCaptureSession()
  // Inputs & Outputs
  private var videoDeviceInput: AVCaptureDeviceInput?
  private var audioDeviceInput: AVCaptureDeviceInput?
  private var photoOutput: AVCapturePhotoOutput?
  private var videoOutput: AVCaptureVideoDataOutput?
  private var audioOutput: AVCaptureAudioDataOutput?
  private var codeScannerOutput: AVCaptureMetadataOutput?
  
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
    
    if !config.isDirty {
      // Nothing changed, just exit.
      return
    }
    
    CameraQueues.cameraQueue.async {
      // Lock Capture Session for configuration
      self.captureSession.beginConfiguration()
      defer {
        self.captureSession.commitConfiguration()
      }
      
      do {
        // Update individually
        if config.requiresDeviceConfiguration {
          try self.configureDevice(configuration: config)
        }
        
        // Update successful, set new configuration!
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
      let pixelFormatType = getPixelFormat(videoOutput: videoOutput)
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
      codeScanner.codeTypes.forEach { type in
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
    
    ReactLogger.log(level: .info, message: "Successfully configured all outputs!")
    onInitialized()
  }
  
}
