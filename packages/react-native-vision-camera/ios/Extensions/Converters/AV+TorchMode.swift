///
/// AV+TorchMode.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension TorchMode {
  init(mode: AVCaptureDevice.TorchMode) {
    switch mode {
    case .off:
      self = .off
    case .on:
      self = .on
    case .auto:
      // we treat `.auto` like `.off`.
      self = .off
    @unknown default:
      self = .off
    }
  }

}
