//
//  CameraView+AVCaptureSession.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 26.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

/**
 Extension for CameraView that sets up the AVCaptureSession, Device and Format.
 */
extension CameraView {
  // pragma MARK: Configure Capture Session

  /**
   Configures the Capture Session.
   */
  final func configureCaptureSession() {
    ReactLogger.log(level: .info, message: "Configuring Session...")
    isReady = false

    #if targetEnvironment(simulator)
      invokeOnError(.device(.notAvailableOnSimulator))
      return
    #endif

    guard cameraId != nil else {
      invokeOnError(.device(.noDevice))
      return
    }
    let cameraId = self.cameraId! as String

    ReactLogger.log(level: .info, message: "Initializing Camera with device \(cameraId)...")
    captureSession.beginConfiguration()
    defer {
      captureSession.commitConfiguration()
    }

    // pragma MARK: Capture Session Inputs
    // Video Input
    do {
      if let videoDeviceInput = videoDeviceInput {
        captureSession.removeInput(videoDeviceInput)
        self.videoDeviceInput = nil
      }
      ReactLogger.log(level: .info, message: "Adding Video input...")
      guard let videoDevice = AVCaptureDevice(uniqueID: cameraId) else {
        invokeOnError(.device(.invalid))
        return
      }
      videoDeviceInput = try AVCaptureDeviceInput(device: videoDevice)
      guard captureSession.canAddInput(videoDeviceInput!) else {
        invokeOnError(.parameter(.unsupportedInput(inputDescriptor: "video-input")))
        return
      }
      captureSession.addInput(videoDeviceInput!)
    } catch {
      invokeOnError(.device(.invalid))
      return
    }

    // pragma MARK: Capture Session Outputs

    // Photo Output
    if let photoOutput = photoOutput {
      captureSession.removeOutput(photoOutput)
      self.photoOutput = nil
    }
    if photo?.boolValue == true {
      ReactLogger.log(level: .info, message: "Adding Photo output...")
      photoOutput = AVCapturePhotoOutput()

      if enableHighQualityPhotos?.boolValue == true {
        // TODO: In iOS 16 this will be removed in favor of maxPhotoDimensions.
        photoOutput!.isHighResolutionCaptureEnabled = true
        if #available(iOS 13.0, *) {
          // TODO: Test if this actually does any fusion or if this just calls the captureOutput twice. If the latter, remove it.
          photoOutput!.isVirtualDeviceConstituentPhotoDeliveryEnabled = photoOutput!.isVirtualDeviceConstituentPhotoDeliverySupported
          photoOutput!.maxPhotoQualityPrioritization = .quality
        } else {
          photoOutput!.isDualCameraDualPhotoDeliveryEnabled = photoOutput!.isDualCameraDualPhotoDeliverySupported
        }
      }
      // TODO: Enable isResponsiveCaptureEnabled? (iOS 17+)
      // TODO: Enable isFastCapturePrioritizationEnabled? (iOS 17+)
      if enableDepthData {
        photoOutput!.isDepthDataDeliveryEnabled = photoOutput!.isDepthDataDeliverySupported
      }
      if #available(iOS 12.0, *), enablePortraitEffectsMatteDelivery {
        photoOutput!.isPortraitEffectsMatteDeliveryEnabled = photoOutput!.isPortraitEffectsMatteDeliverySupported
      }
      guard captureSession.canAddOutput(photoOutput!) else {
        invokeOnError(.parameter(.unsupportedOutput(outputDescriptor: "photo-output")))
        return
      }
      captureSession.addOutput(photoOutput!)
      if videoDeviceInput!.device.position == .front {
        photoOutput!.mirror()
      }
    }

    // Video Output + Frame Processor
    if let videoOutput = videoOutput {
      captureSession.removeOutput(videoOutput)
      self.videoOutput = nil
    }
    if video?.boolValue == true || enableFrameProcessor {
      ReactLogger.log(level: .info, message: "Adding Video Data output...")
      videoOutput = AVCaptureVideoDataOutput()
      guard captureSession.canAddOutput(videoOutput!) else {
        invokeOnError(.parameter(.unsupportedOutput(outputDescriptor: "video-output")))
        return
      }
      videoOutput!.setSampleBufferDelegate(self, queue: CameraQueues.videoQueue)
      videoOutput!.alwaysDiscardsLateVideoFrames = false

      let pixelFormatType = getPixelFormat(videoOutput: videoOutput!)
      videoOutput!.videoSettings = [
        String(kCVPixelBufferPixelFormatTypeKey): pixelFormatType,
      ]
      captureSession.addOutput(videoOutput!)
    }

    if outputOrientation != .portrait {
      updateOrientation()
    }

    invokeOnInitialized()
    isReady = true
    ReactLogger.log(level: .info, message: "Session successfully configured!")
  }

  /**
   Returns the pixel format that should be used for the AVCaptureVideoDataOutput.
   If HDR is enabled, this will return YUV 4:2:0 10-bit.
   If HDR is disabled, this will return whatever the user specified as a pixelFormat, or the most efficient format as a fallback.
   */
  private func getPixelFormat(videoOutput: AVCaptureVideoDataOutput) -> OSType {
    // as per documentation, the first value is always the most efficient format
    let defaultFormat = videoOutput.availableVideoPixelFormatTypes.first!

    // If the user enabled HDR, we can only use the YUV 4:2:0 10-bit pixel format.
    if hdr == true {
      guard pixelFormat == nil || pixelFormat == "yuv" else {
        invokeOnError(.format(.incompatiblePixelFormatWithHDR))
        return defaultFormat
      }

      var targetFormats = [kCVPixelFormatType_420YpCbCr10BiPlanarFullRange,
                           kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange]
      if enableBufferCompression {
        // If we enable buffer compression, try to use a lossless compressed YUV format first, otherwise fall back to the others.
        targetFormats.insert(kCVPixelFormatType_Lossless_420YpCbCr10PackedBiPlanarVideoRange, at: 0)
      }

      // Find the best matching format
      guard let format = videoOutput.findPixelFormat(firstOf: targetFormats) else {
        invokeOnError(.format(.invalidHdr))
        return defaultFormat
      }
      // YUV 4:2:0 10-bit (compressed/uncompressed)
      return format
    }

    // If the user didn't specify a custom pixelFormat, just return the default one.
    guard let pixelFormat = pixelFormat else {
      return defaultFormat
    }

    // If we don't use HDR, we can use any other custom pixel format.
    switch pixelFormat {
    case "yuv":
      // YUV 4:2:0 8-bit (full/limited video colors; uncompressed)
      var targetFormats = [kCVPixelFormatType_420YpCbCr8BiPlanarFullRange,
                           kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange]
      if enableBufferCompression {
        // YUV 4:2:0 8-bit (full/limited video colors; compressed)
        targetFormats.insert(kCVPixelFormatType_Lossless_420YpCbCr8BiPlanarVideoRange, at: 0)
        targetFormats.insert(kCVPixelFormatType_Lossless_420YpCbCr8BiPlanarFullRange, at: 0)
      }
      guard let format = videoOutput.findPixelFormat(firstOf: targetFormats) else {
        invokeOnError(.device(.pixelFormatNotSupported))
        return defaultFormat
      }
      return format
    case "rgb":
      // RGBA 8-bit (uncompressed)
      var targetFormats = [kCVPixelFormatType_32BGRA]
      if enableBufferCompression {
        // RGBA 8-bit (compressed)
        targetFormats.insert(kCVPixelFormatType_Lossless_32BGRA, at: 0)
      }
      guard let format = videoOutput.findPixelFormat(firstOf: targetFormats) else {
        invokeOnError(.device(.pixelFormatNotSupported))
        return defaultFormat
      }
      return format
    case "native":
      return defaultFormat
    default:
      invokeOnError(.parameter(.invalid(unionName: "pixelFormat", receivedValue: pixelFormat as String)))
      return defaultFormat
    }
  }

  // pragma MARK: Configure Device

  /**
   Configures the Video Device with the given FPS and HDR modes.
   */
  final func configureDevice() {
    ReactLogger.log(level: .info, message: "Configuring Device...")
    guard let device = videoDeviceInput?.device else {
      invokeOnError(.session(.cameraNotReady))
      return
    }

    do {
      try device.lockForConfiguration()

      if let fps = fps?.int32Value {
        let supportsGivenFps = device.activeFormat.videoSupportedFrameRateRanges.contains { range in
          return range.includes(fps: Double(fps))
        }
        if !supportsGivenFps {
          invokeOnError(.format(.invalidFps(fps: Int(fps))))
          return
        }

        let duration = CMTimeMake(value: 1, timescale: fps)
        device.activeVideoMinFrameDuration = duration
        device.activeVideoMaxFrameDuration = duration
      } else {
        device.activeVideoMinFrameDuration = CMTime.invalid
        device.activeVideoMaxFrameDuration = CMTime.invalid
      }
      if lowLightBoost != nil {
        if lowLightBoost == true && !device.isLowLightBoostSupported {
          invokeOnError(.device(.lowLightBoostNotSupported))
          return
        }
        if device.automaticallyEnablesLowLightBoostWhenAvailable != lowLightBoost!.boolValue {
          device.automaticallyEnablesLowLightBoostWhenAvailable = lowLightBoost!.boolValue
        }
      }

      device.unlockForConfiguration()
      ReactLogger.log(level: .info, message: "Device successfully configured!")
    } catch let error as NSError {
      invokeOnError(.device(.configureError), cause: error)
      return
    }
  }

  // pragma MARK: Configure Format

  /**
   Configures the Video Device to find the best matching Format.
   */
  final func configureFormat() {
    ReactLogger.log(level: .info, message: "Configuring Format...")
    guard let filter = format else {
      // Format Filter was null. Ignore it.
      return
    }
    guard let device = videoDeviceInput?.device else {
      invokeOnError(.session(.cameraNotReady))
      return
    }

    if device.activeFormat.matchesFilter(filter) {
      ReactLogger.log(level: .info, message: "Active format already matches filter.")
      return
    }

    // get matching format
    let matchingFormats = device.formats.filter { $0.matchesFilter(filter) }.sorted { $0.isBetterThan($1) }
    guard let format = matchingFormats.first else {
      invokeOnError(.format(.invalidFormat))
      return
    }

    do {
      try device.lockForConfiguration()
      device.activeFormat = format
      device.unlockForConfiguration()
      ReactLogger.log(level: .info, message: "Format successfully configured!")
    } catch let error as NSError {
      invokeOnError(.device(.configureError), cause: error)
      return
    }
  }

  // pragma MARK: Notifications/Interruptions

  @objc
  func sessionRuntimeError(notification: Notification) {
    ReactLogger.log(level: .error, message: "Unexpected Camera Runtime Error occured!")
    guard let error = notification.userInfo?[AVCaptureSessionErrorKey] as? AVError else {
      return
    }

    invokeOnError(.unknown(message: error._nsError.description), cause: error._nsError)

    if isActive {
      // restart capture session after an error occured
      CameraQueues.cameraQueue.async {
        self.captureSession.startRunning()
      }
    }
  }
}
