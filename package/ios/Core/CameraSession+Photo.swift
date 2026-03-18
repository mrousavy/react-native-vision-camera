//
//  CameraSession+Photo.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension CameraSession {
  /**
   Captures a photo.
   `takePhoto` is only available if `photo={true}`.
   */
  func takePhoto(options: TakePhotoOptions, promise: Promise) {
    CameraQueues.cameraQueue.async {
      // Validate configuration
      guard let configuration = self.configuration else {
        promise.reject(error: .session(.cameraNotReady))
        return
      }
      guard configuration.photo != .disabled else {
        promise.reject(error: .capture(.photoNotEnabled))
        return
      }

      // Validate outputs and inputs
      guard let photoOutput = self.photoOutput,
            let videoDeviceInput = self.videoDeviceInput else {
        promise.reject(error: .session(.cameraNotReady))
        return
      }

      VisionLogger.log(level: .info, message: "Capturing photo...")

      // Ensure session and video connection are ready
      self.ensureReadyToCapture(repairIfNeeded: true) { ready in
        guard ready else {
          VisionLogger.log(level: .error, message: "Photo capture failed: session or connection not ready.")
          promise.reject(error: .session(.cameraNotReady))
          return
        }

        // Build photo settings
        let photoSettings = AVCapturePhotoSettings()

        if #available(iOS 16.0, *) {
          photoSettings.maxPhotoDimensions = photoOutput.maxPhotoDimensions
        } else {
          photoSettings.isHighResolutionPhotoEnabled = photoOutput.isHighResolutionCaptureEnabled
        }

        // Depth / Portrait / Distortion
        if photoOutput.isDepthDataDeliverySupported {
          photoSettings.isDepthDataDeliveryEnabled = photoOutput.isDepthDataDeliveryEnabled
        }
        if #available(iOS 12.0, *) {
          photoSettings.isPortraitEffectsMatteDeliveryEnabled = photoOutput.isPortraitEffectsMatteDeliveryEnabled
        }
        if #available(iOS 13.0, *) {
          photoSettings.photoQualityPrioritization = photoOutput.maxPhotoQualityPrioritization
        }
        photoSettings.isAutoRedEyeReductionEnabled = options.enableAutoRedEyeReduction
        if #available(iOS 14.1, *),
           photoOutput.isContentAwareDistortionCorrectionSupported {
          photoSettings.isAutoContentAwareDistortionCorrectionEnabled = options.enableAutoDistortionCorrection
        }

        // Flash
        if options.flash != .off {
          guard videoDeviceInput.device.hasFlash else {
            promise.reject(error: .capture(.flashNotAvailable))
            return
          }
        }
        if videoDeviceInput.device.isFlashAvailable {
          photoSettings.flashMode = options.flash.toFlashMode()
        }

        // Final connection guard
        guard let videoConn = photoOutput.connection(with: .video),
              videoConn.isEnabled, videoConn.isActive else {
          VisionLogger.log(level: .error, message: "No active and enabled video connection for photo capture.")
          promise.reject(error: .session(.cameraNotReady))
          return
        }

        // Capture
        let photoCaptureDelegate = PhotoCaptureDelegate(
          promise: promise,
          enableShutterSound: options.enableShutterSound,
          metadataProvider: self.metadataProvider,
          path: options.path,
          cameraSessionDelegate: self.delegate
        )
        photoOutput.capturePhoto(with: photoSettings, delegate: photoCaptureDelegate)

        // Prepare next settings
        photoOutput.setPreparedPhotoSettingsArray([photoSettings], completionHandler: nil)
      }
    }
  }

  // MARK: - Readiness / Repair

  /// Ensures the session is running and the video connection is enabled + active.
  /// Optionally tries to repair the output and waits shortly to handle race conditions.
  private func ensureReadyToCapture(repairIfNeeded: Bool,
                                    timeout: TimeInterval = 0.5,
                                    poll: TimeInterval = 0.05,
                                    completion: @escaping (Bool) -> Void) {
    if isReadyNowActive() {
      completion(true)
      return
    }

    var repairedOnce = false
    let deadline = DispatchTime.now() + timeout

    func tick() {
      if isReadyNowActive() {
        completion(true)
        return
      }
      if repairIfNeeded && !repairedOnce {
        repairedOnce = repairPhotoConnectionIfNeeded()
      }
      if DispatchTime.now() < deadline {
        CameraQueues.cameraQueue.asyncAfter(deadline: .now() + poll) { tick() }
      } else {
        completion(false)
      }
    }

    tick()
  }

  /// Checks if session is running and the video connection is enabled and active.
  private func isReadyNowActive() -> Bool {
    guard let photoOutput = self.photoOutput else { return false }
    let running = self.captureSession.isRunning
    guard running, let conn = photoOutput.connection(with: .video) else { return false }
    return conn.isEnabled && conn.isActive
  }

  /// Repairs the photo output connection by re-adding it to the session.
  @discardableResult
  private func repairPhotoConnectionIfNeeded() -> Bool {
    guard let photoOutput = self.photoOutput else { return false }
    let session = self.captureSession

    let conn = photoOutput.connection(with: .video)
    if conn?.isEnabled == true && conn?.isActive == true { return false }

    VisionLogger.log(level: .info, message: "Repairing photo connection...")

    session.beginConfiguration()

    if session.canSetSessionPreset(.photo) {
      session.sessionPreset = .photo
    }

    if session.outputs.contains(photoOutput) {
      session.removeOutput(photoOutput)
    }
    if session.canAddOutput(photoOutput) {
      session.addOutput(photoOutput)
    }

    session.commitConfiguration()

    if !session.isRunning {
      session.startRunning()
    }

    return true
  }
}
