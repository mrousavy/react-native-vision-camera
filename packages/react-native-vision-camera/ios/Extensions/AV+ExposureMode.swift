///
/// AV+ExposureMode.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

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
      print("Unknown ExposureMode: \(mode)")
      self = .custom
    }
  }

  func toAVCaptureDeviceExposureMode() -> AVCaptureDevice.ExposureMode {
    switch self {
    case .locked:
      return .locked
    case .autoExposure:
      return .autoExpose
    case .continuousAutoExposure:
      return .continuousAutoExposure
    case .custom:
      return .custom
    }
  }
}
