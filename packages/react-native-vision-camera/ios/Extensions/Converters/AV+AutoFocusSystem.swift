///
/// AutoFocusSystem+toAVAutoFocusSystem.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AutoFocusSystem {
  init(af: AVCaptureDevice.Format.AutoFocusSystem) {
    switch af {
    case .none:
      self = .none
    case .contrastDetection:
      self = .contrastDetection
    case .phaseDetection:
      self = .phaseDetection
    @unknown default:
      self = .none
    }
  }

}
