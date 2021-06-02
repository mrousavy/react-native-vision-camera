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

    measureElapsedTime {
      do {
        let audioSession = AVAudioSession.sharedInstance()
        // deactivates, updates category and activates session again if category/options are not equal.
        try audioSession.updateCategory(AVAudioSession.Category.playAndRecord, options: [.mixWithOthers, .allowBluetoothA2DP, .defaultToSpeaker])
        // allows haptic feedback (vibrations) and system sounds to play while recording.
        audioSession.trySetAllowHaptics(true)
      } catch let error as NSError {
        switch error.code {
        case 561_017_449:
          self.invokeOnError(.session(.audioInUseByOtherApp), cause: error)
        default:
          self.invokeOnError(.session(.audioSessionSetupFailed(reason: error.description)), cause: error)
        }
      }
    }
  }

  /**
   Deactivate the shared Audio Session.
   */
  final func deactivateAudioSession() {
    ReactLogger.log(level: .info, message: "Deactivating Audio Session...")

    measureElapsedTime {
      do {
        try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
      } catch let error as NSError {
        self.invokeOnError(.session(.audioSessionSetupFailed(reason: error.description)), cause: error)
      }
    }
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
      ReactLogger.log(level: .error, message: "The Audio Session was interrupted!", alsoLogToJS: true)
    case .ended:
      ReactLogger.log(level: .info, message: "The Audio Session interruption has ended.")
      guard let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt else { return }
      let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
      if options.contains(.shouldResume) {
        ReactLogger.log(level: .info, message: "Resuming interrupted Audio Session...", alsoLogToJS: true)
        if isRecording {
          // restart audio session because interruption is over
          activateAudioSession()
        }
      } else {
        ReactLogger.log(level: .error, message: "Cannot resume interrupted Audio Session!", alsoLogToJS: true)
      }
    @unknown default: ()
    }
  }
}
