//
//  CameraView+AVCaptureSession.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 26.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import AVFoundation
import Foundation

/**
 Extension for CameraView that sets up the AVCaptureSession, Device and Format.
 */
extension CameraView {
  /**
   Configures the Capture Session.
   */
  final func configureCaptureSession() {
    ReactLogger.log(level: .info, message: "Configuring Session...")
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

    // Disable automatic Audio Session configuration because we configure it in CameraView+AVAudioSession.swift (called before Camera gets activated)
    captureSession.automaticallyConfiguresApplicationAudioSession = false

    // If preset is set, use preset. Otherwise use format.
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

    invokeOnInitialized()
    isReady = true
    ReactLogger.log(level: .info, message: "Session successfully configured!")
  }

  /**
   Configures the Video Device with the given FPS, HDR and ColorSpace.
   */
  final func configureDevice() {
    ReactLogger.log(level: .info, message: "Configuring Device...")
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
      ReactLogger.log(level: .info, message: "Device successfully configured!")
    } catch let error as NSError {
      return invokeOnError(.device(.configureError), cause: error)
    }
  }

  /**
   Configures the Video Device to find the best matching Format.
   */
  final func configureFormat() {
    ReactLogger.log(level: .info, message: "Configuring Format...")
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
      ReactLogger.log(level: .info, message: "Format successfully configured!")
    } catch let error as NSError {
      return invokeOnError(.device(.configureError), cause: error)
    }
  }

  @objc
  func sessionRuntimeError(notification: Notification) {
    ReactLogger.log(level: .error, message: "Unexpected Camera Runtime Error occured!")
    guard let error = notification.userInfo?[AVCaptureSessionErrorKey] as? AVError else {
      return
    }

    invokeOnError(.unknown(message: error._nsError.description), cause: error._nsError)

    if isActive {
      // restart capture session after an error occured
      queue.async {
        self.captureSession.startRunning()
      }
    }
  }

  @objc
  func sessionInterruptionBegin(notification: Notification) {
    ReactLogger.log(level: .error, message: "Capture Session Interruption begin Notification!")
    guard let reasonNumber = notification.userInfo?[AVCaptureSessionInterruptionReasonKey] as? NSNumber else {
      return
    }
    let reason = AVCaptureSession.InterruptionReason(rawValue: reasonNumber.intValue)

    switch reason {
    case .audioDeviceInUseByAnotherClient:
      // remove audio input so iOS thinks nothing is wrong and won't pause the session.
      removeAudioInput()
    default:
      // don't do anything, iOS will automatically pause session
      break
    }
  }

  @objc
  func sessionInterruptionEnd(notification: Notification) {
    ReactLogger.log(level: .error, message: "Capture Session Interruption end Notification!")
    guard let reasonNumber = notification.userInfo?[AVCaptureSessionInterruptionReasonKey] as? NSNumber else {
      return
    }
    let reason = AVCaptureSession.InterruptionReason(rawValue: reasonNumber.intValue)

    switch reason {
    case .audioDeviceInUseByAnotherClient:
      // add audio again because we removed it when we received the interruption.
      configureAudioSession()
    default:
      // don't do anything, iOS will automatically resume session
      break
    }
  }
}
