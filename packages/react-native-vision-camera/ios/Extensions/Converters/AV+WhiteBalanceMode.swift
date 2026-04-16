///
/// AV+WhiteBalanceMode.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension WhiteBalanceMode {
  init(mode: AVCaptureDevice.WhiteBalanceMode) {
    switch mode {
    case .locked:
      self = .locked
    case .autoWhiteBalance:
      self = .autoWhiteBalance
    case .continuousAutoWhiteBalance:
      self = .continuousAutoWhiteBalance
    @unknown default:
      self = .autoWhiteBalance
    }
  }

}
