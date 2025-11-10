///
/// AV+TorchMode.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension TorchMode {
  init(mode: AVCaptureDevice.TorchMode) {
    switch mode {
    case .off:
      self = .off
    case .on:
      self = .on
    case .auto:
      self = .auto
    @unknown default:
      self = .off
    }
  }

  func toAVCaptureDeviceTorchMode() -> AVCaptureDevice.TorchMode {
    switch self {
    case .on:
      return .on
    case .off:
      return .off
    case .auto:
      return .auto
    }
  }
}
