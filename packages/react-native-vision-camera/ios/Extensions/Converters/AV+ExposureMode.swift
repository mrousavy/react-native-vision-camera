///
/// AV+ExposureMode.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension ExposureMode {
  init(mode: AVCaptureDevice.ExposureMode) {
    switch mode {
    case .locked:
      self = .locked
    case .autoExpose:
      self = .autoExposure
    case .continuousAutoExposure:
      self = .continuousAutoExposure
    case .custom:
      self = .custom
    @unknown default:
      logger.error("Unknown ExposureMode: \(mode.rawValue)")
      self = .custom
    }
  }

}
