//
//  AVAudioSession+trySetAllowHaptics.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 26.03.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation
import AVFoundation

extension AVAudioSession {
  /**
   Tries to set allowHapticsAndSystemSoundsDuringRecording and ignore errors.
   */
  func trySetAllowHaptics(_ allowHaptics: Bool) {
    if #available(iOS 13.0, *) {
      if !self.allowHapticsAndSystemSoundsDuringRecording {
        try? self.setAllowHapticsAndSystemSoundsDuringRecording(true)
      }
    }
  }
}
