//
//  CameraView+AVAudioSession.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 26.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import AVFoundation
import Foundation

/**
 Extension for CameraView that sets up the AVAudioSession.
 */
extension CameraView {
  /**
   Configures the Audio session to allow background-music playback while recording.
   */
  final func configureAudioSession() {
    let start = DispatchTime.now()
    do {
      try addAudioInput()

      let audioSession = AVAudioSession.sharedInstance()
      if audioSession.category != .playAndRecord {
        // allow background music playback
        try audioSession.setCategory(AVAudioSession.Category.playAndRecord, options: [.mixWithOthers, .allowBluetoothA2DP, .defaultToSpeaker])
      }
      audioSession.trySetAllowHaptics(true)

      // activate current audio session because camera is active
      try audioSession.setActive(true)
    } catch let error as NSError {
      switch error.code {
      case 561_017_449:
        self.invokeOnError(.session(.audioInUseByOtherApp), cause: error)
      default:
        self.invokeOnError(.session(.audioSessionSetupFailed(reason: error.description)), cause: error)
      }
      self.removeAudioInput()
    }

    let end = DispatchTime.now()
    let nanoTime = end.uptimeNanoseconds - start.uptimeNanoseconds
    ReactLogger.log(level: .info, message: "Configured Audio session in \(Double(nanoTime) / 1_000_000)ms!")
  }

  /**
   Configures the CaptureSession and adds the audio device if it has not already been added yet.
   */
  func addAudioInput() throws {
    if audioDeviceInput != nil {
      // we already added the audio device, don't add it again
      return
    }
    removeAudioInput()

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
        // restart audio session because interruption is over
        configureAudioSession()
      } else {
        ReactLogger.log(level: .error, message: "Cannot resume interrupted Audio Session!")
      }
    @unknown default: ()
    }
  }
}
