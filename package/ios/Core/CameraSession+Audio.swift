//
//  CameraSession+Audio.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension CameraSession {
  /**
   Configures the Audio Capture Session with an audio input and audio data output.
   */
  final func configureAudioSession(configuration: CameraConfiguration) throws {
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

  /**
   Configures the Audio session and activates it. If the session was active it will shortly be deactivated before configuration.

   The Audio Session will be configured to allow background music, haptics (vibrations) and system sound playback while recording.
   Background audio is allowed to play on speakers or bluetooth speakers.
   */
  final func activateAudioSession() throws {
    ReactLogger.log(level: .info, message: "Activating Audio Session...")

    do {
      try AVAudioSession.sharedInstance().updateCategory(AVAudioSession.Category.playAndRecord,
                                                         options: [.mixWithOthers,
                                                                   .allowBluetoothA2DP,
                                                                   .defaultToSpeaker,
                                                                   .allowAirPlay])

      if #available(iOS 14.5, *) {
        // prevents the audio session from being interrupted by a phone call
        try AVAudioSession.sharedInstance().setPrefersNoInterruptionsFromSystemAlerts(true)
      }

      audioCaptureSession.startRunning()
    } catch let error as NSError {
      ReactLogger.log(level: .error, message: "Failed to activate audio session! Error \(error.code): \(error.description)")
      switch error.code {
      case 561_017_449:
        throw CameraError.session(.audioInUseByOtherApp)
      default:
        throw CameraError.session(.audioSessionFailedToActivate)
      }
    }
  }

  final func deactivateAudioSession() {
    ReactLogger.log(level: .info, message: "Deactivating Audio Session...")

    audioCaptureSession.stopRunning()
  }

  @objc
  func audioSessionInterrupted(notification: Notification) {
    ReactLogger.log(level: .error, message: "Audio Session Interruption Notification!")
    guard let userInfo = notification.userInfo,
          let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
      return
    }

    // TODO: Add JS-Event for Audio Session interruptions?
    switch type {
    case .began:
      // Something interrupted our Audio Session, stop recording audio.
      ReactLogger.log(level: .error, message: "The Audio Session was interrupted!")
    case .ended:
      ReactLogger.log(level: .info, message: "The Audio Session interruption has ended.")
      guard let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt else { return }
      let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
      if options.contains(.shouldResume) {
        // Try resuming if possible
        if isRecording {
          CameraQueues.audioQueue.async {
            ReactLogger.log(level: .info, message: "Resuming interrupted Audio Session...")
            // restart audio session because interruption is over
            try? self.activateAudioSession()
          }
        }
      } else {
        ReactLogger.log(level: .error, message: "Cannot resume interrupted Audio Session!")
      }
    @unknown default:
      ()
    }
  }
}
