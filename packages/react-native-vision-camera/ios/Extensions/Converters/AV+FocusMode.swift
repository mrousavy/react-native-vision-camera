///
/// AV+FocusMode.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension FocusMode {
  init(mode: AVCaptureDevice.FocusMode) {
    switch mode {
    case .locked:
      self = .locked
    case .autoFocus:
      self = .autoFocus
    case .continuousAutoFocus:
      self = .continuousAutoFocus
    @unknown default:
      self = .autoFocus
    }
  }

}
