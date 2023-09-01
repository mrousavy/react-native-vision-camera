//
//  AVAudioSession+trySetAllowHaptics.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 26.03.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension AVAudioSession {
  /**
   Tries to set allowHapticsAndSystemSoundsDuringRecording and ignore errors.
   */
  func trySetAllowHaptics(_ allowHaptics: Bool) {
    if #available(iOS 13.0, *) {
      if !self.allowHapticsAndSystemSoundsDuringRecording {
        try? self.setAllowHapticsAndSystemSoundsDuringRecording(allowHaptics)
      }
    }
  }
}
