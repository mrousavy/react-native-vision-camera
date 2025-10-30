///
/// AV+WhiteBalanceMode.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

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

  func toAVCaptureDeviceWhiteBalanceMode() -> AVCaptureDevice.WhiteBalanceMode {
    switch self {
    case .locked:
      return .locked
    case .autoWhiteBalance:
      return .autoWhiteBalance
    case .continuousAutoWhiteBalance:
      return .continuousAutoWhiteBalance
    }
  }
}
