//
//  AVAudioSession+Port.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 19.09.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation

extension AVAudioSession.Port {
  func toString() -> String {
    switch self {
    case .bluetoothA2DP, .bluetoothHFP, .bluetoothLE:
      return "bluetooth-microphone"
    case .builtInMic:
      return "built-in-microphone"
    case .carAudio, .hdmi, .lineIn, .lineOut, .speaker, .headphones, .headsetMic, .usbAudio:
      return "external-microphone"
    default:
      return "unknown"
    }
  }
}
