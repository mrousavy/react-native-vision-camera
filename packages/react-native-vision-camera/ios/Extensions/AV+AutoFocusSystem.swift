///
/// AutoFocusSystem+toAVAutoFocusSystem.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

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

  func toAVAutoFocusSystem() -> AVCaptureDevice.Format.AutoFocusSystem {
    switch self {
    case .none:
      return .none
    case .contrastDetection:
      return .contrastDetection
    case .phaseDetection:
      return .phaseDetection
    }
  }
}
