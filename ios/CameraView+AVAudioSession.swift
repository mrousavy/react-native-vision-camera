//
//  CameraView+AVAudioSession.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 26.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

/**
 Extension for CameraView that sets up the AVAudioSession.
 */
extension CameraView {
  /**
   Configures the Audio session and activates it. If the session was active it will shortly be deactivated before configuration.

   The Audio Session will be configured to allow background music, haptics (vibrations) and system sound playback while recording.
   Background audio is allowed to play on speakers or bluetooth speakers.
   */
  final func activateAudioSession() {
    ReactLogger.log(level: .info, message: "Activating Audio Session...")

    measureElapsedTime(label: "Audio Session activation") {
      do {
        let audioSession = AVAudioSession.sharedInstance()
        // deactivates, updates category and activates session again if category/options are not equal.
        try audioSession.updateCategory(AVAudioSession.Category.playAndRecord, options: [.mixWithOthers, .allowBluetoothA2DP, .defaultToSpeaker])
        // allows haptic feedback (vibrations) and system sounds to play while recording.
        audioSession.trySetAllowHaptics(true)

        try addAudioInput()
      } catch let error as NSError {
        switch error.code {
        case 561_017_449:
          self.invokeOnError(.session(.audioInUseByOtherApp), cause: error)
        default:
          self.invokeOnError(.session(.audioSessionSetupFailed(reason: error.description)), cause: error)
        }
        self.removeAudioInput()
      }
    }
  }

  /**
   Deactivate the shared Audio Session.
   */
  final func deactivateAudioSession() {
    ReactLogger.log(level: .info, message: "Deactivating Audio Session...")

    measureElapsedTime(label: "Audio Session deactivation") {
      do {
        removeAudioInput()
        try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
      } catch let error as NSError {
        self.invokeOnError(.session(.audioSessionSetupFailed(reason: error.description)), cause: error)
      }
    }
  }

  /**
   Configures the CaptureSession and adds the audio device if it has not already been added yet.
   */
  func addAudioInput() throws {
    if audioDeviceInput != nil {
      // we already added the audio device, don't add it again
      return
    }

    ReactLogger.log(level: .info, message: "Adding audio input...")
    captureSession.beginConfiguration()
    guard let audioDevice = AVCaptureDevice.default(for: .audio) else {
      throw CameraError.device(.microphoneUnavailable)
    }
    audioDeviceInput = try AVCaptureDeviceInput(device: audioDevice)
    guard captureSession.canAddInput(audioDeviceInput!) else {
      throw CameraError.parameter(.unsupportedInput(inputDescriptor: "audio-input"))
    }
    captureSession.addInput(audioDeviceInput!)
    captureSession.automaticallyConfiguresApplicationAudioSession = false
    captureSession.commitConfiguration()
  }

  /**
   Configures the CaptureSession and removes the audio device if it has been added before.
   */
  func removeAudioInput() {
    guard let audioInput = audioDeviceInput else {
      return
    }

    ReactLogger.log(level: .info, message: "Removing audio input...")
    captureSession.beginConfiguration()
    captureSession.removeInput(audioInput)
    audioDeviceInput = nil
    captureSession.commitConfiguration()
  }

  @objc
  func audioSessionInterrupted(notification: Notification) {
    ReactLogger.log(level: .error, message: "Audio Session Interruption Notification!")
    guard let userInfo = notification.userInfo,
          let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
      return
    }

    switch type {
    case .began:
      // Something interrupted our Audio Session, stop recording audio.
      ReactLogger.log(level: .error, message: "The Audio Session was interrupted!")
      removeAudioInput()
    case .ended:
      ReactLogger.log(level: .error, message: "The Audio Session interruption has ended.")
      guard let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt else { return }
      let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
      if options.contains(.shouldResume) {
        ReactLogger.log(level: .error, message: "Resuming interrupted Audio Session...")
        if isRecording {
          // restart audio session because interruption is over
          activateAudioSession()
        }
      } else {
        ReactLogger.log(level: .error, message: "Cannot resume interrupted Audio Session!")
      }
    @unknown default: ()
    }
  }
}
