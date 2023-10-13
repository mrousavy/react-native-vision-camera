//
//  CameraSession+Configuration.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 12.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension CameraSession {
  // pragma MARK: Input Device

  /**
   Configures the Input Device (`cameraId`)
   */
  func configureDevice(configuration: CameraConfiguration) throws {
    ReactLogger.log(level: .info, message: "Configuring Input Device...")

    // Remove all inputs
    captureSession.inputs.forEach { input in
      captureSession.removeInput(input)
    }
    videoDeviceInput = nil

    #if targetEnvironment(simulator)
      // iOS Simulators don't have Cameras
      throw CameraError.device(.notAvailableOnSimulator)
    #endif

    guard let cameraId = configuration.cameraId else {
      throw CameraError.device(.noDevice)
    }

    ReactLogger.log(level: .info, message: "Configuring Camera \(cameraId)...")
    // Video Input (Camera Device/Sensor)
    guard let videoDevice = AVCaptureDevice(uniqueID: cameraId) else {
      throw CameraError.device(.invalid)
    }
    let input = try AVCaptureDeviceInput(device: videoDevice)
    guard captureSession.canAddInput(input) else {
      throw CameraError.parameter(.unsupportedInput(inputDescriptor: "video-input"))
    }
    captureSession.addInput(input)
    videoDeviceInput = input

    ReactLogger.log(level: .info, message: "Successfully configured Input Device!")
  }

  // pragma MARK: Outputs

  /**
   Configures all outputs (`photo` + `video` + `codeScanner`)
   */
  func configureOutputs(configuration: CameraConfiguration) throws {
    ReactLogger.log(level: .info, message: "Configuring Outputs...")

    // Remove all outputs
    captureSession.outputs.forEach { output in
      captureSession.removeOutput(output)
    }
    photoOutput = nil
    videoOutput = nil
    audioOutput = nil
    codeScannerOutput = nil

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
      videoOutput.alwaysDiscardsLateVideoFrames = true
      let pixelFormatType = try video.getPixelFormat(for: videoOutput)
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

    // Done!
    ReactLogger.log(level: .info, message: "Successfully configured all outputs!")
    delegate?.onSessionInitialized()
  }

  // pragma MARK: Orientation

  func configureOrientation(configuration: CameraConfiguration) {
    // Set up orientation and mirroring for all outputs.
    // Note: Photos are only rotated through EXIF tags, and Preview through view transforms
    let isMirrored = videoDeviceInput?.device.position == .front
    captureSession.outputs.forEach { output in
      if isMirrored {
        output.mirror()
      }
      output.setOrientation(configuration.orientation)
    }
  }

  // pragma MARK: Format

  /**
   Configures the active format (`format`)
   */
  func configureFormat(configuration: CameraConfiguration) throws {
    guard let targetFormat = configuration.format else {
      // No format was set, just use the default.
      return
    }

    ReactLogger.log(level: .info, message: "Configuring Format (\(targetFormat))...")
    guard let device = videoDeviceInput?.device else {
      throw CameraError.session(.cameraNotReady)
    }

    let currentFormat = CameraDeviceFormat(fromFormat: device.activeFormat)
    if currentFormat == targetFormat {
      ReactLogger.log(level: .info, message: "Already selected active format, no need to configure.")
      return
    }

    // Find matching format (JS Dictionary -> strongly typed Swift class)
    let format = device.formats.first { targetFormat.isEqualTo(format: $0) }
    guard let format else {
      throw CameraError.format(.invalidFormat)
    }

    // Set new device Format
    device.activeFormat = format

    ReactLogger.log(level: .info, message: "Successfully configured Format!")
  }

  // pragma MARK: Side-Props

  /**
   Configures format-dependant "side-props" (`fps`, `lowLightBoost`, `torch`)
   */
  func configureSideProps(configuration: CameraConfiguration) throws {
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

    // Configure Torch
    if configuration.torch != .off {
      guard device.hasTorch else {
        throw CameraError.device(.flashUnavailable)
      }

      device.torchMode = configuration.torch.toTorchMode()
      try device.setTorchModeOn(level: 1.0)
    }
  }

  // pragma MARK: Zoom

  /**
   Configures zoom (`zoom`)
   */
  func configureZoom(configuration: CameraConfiguration) throws {
    guard let device = videoDeviceInput?.device else {
      throw CameraError.session(.cameraNotReady)
    }
    guard let zoom = configuration.zoom else {
      return
    }

    let clamped = max(min(zoom, device.activeFormat.videoMaxZoomFactor), device.minAvailableVideoZoomFactor)
    device.videoZoomFactor = clamped
  }

  // pragma MARK: Audio

  /**
   Configures the Audio Capture Session with an audio input and audio data output.
   */
  func configureAudioSession(configuration: CameraConfiguration) throws {
    ReactLogger.log(level: .info, message: "Configuring Audio Session...")

    // Prevent iOS from automatically configuring the Audio Session for us
    audioCaptureSession.automaticallyConfiguresApplicationAudioSession = false
    let enableAudio = configuration.audio != .disabled

    // Check microphone permission
    if enableAudio {
      let audioPermissionStatus = AVCaptureDevice.authorizationStatus(for: .audio)
      if audioPermissionStatus != .authorized {
        throw CameraError.permission(.microphone)
      }
    }

    // Remove all current inputs
    audioCaptureSession.inputs.forEach { input in
      audioCaptureSession.removeInput(input)
    }
    audioDeviceInput = nil

    // Audio Input (Microphone)
    if enableAudio {
      ReactLogger.log(level: .info, message: "Adding Audio input...")
      guard let microphone = AVCaptureDevice.default(for: .audio) else {
        throw CameraError.device(.microphoneUnavailable)
      }
      let input = try AVCaptureDeviceInput(device: microphone)
      guard audioCaptureSession.canAddInput(input) else {
        throw CameraError.parameter(.unsupportedInput(inputDescriptor: "audio-input"))
      }
      audioCaptureSession.addInput(input)
      audioDeviceInput = input
    }

    // Remove all current outputs
    audioCaptureSession.outputs.forEach { output in
      audioCaptureSession.removeOutput(output)
    }
    audioOutput = nil

    // Audio Output
    if enableAudio {
      ReactLogger.log(level: .info, message: "Adding Audio Data output...")
      let output = AVCaptureAudioDataOutput()
      guard audioCaptureSession.canAddOutput(output) else {
        throw CameraError.parameter(.unsupportedOutput(outputDescriptor: "audio-output"))
      }
      output.setSampleBufferDelegate(self, queue: CameraQueues.audioQueue)
      audioCaptureSession.addOutput(output)
      audioOutput = output
    }
  }
}
