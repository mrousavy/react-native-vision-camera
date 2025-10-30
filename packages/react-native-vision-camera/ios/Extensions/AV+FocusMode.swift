///
/// AV+FocusMode.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

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

  func toAVCaptureDeviceFocusMode() -> AVCaptureDevice.FocusMode {
    switch self {
    case .locked:
      return .locked
    case .autoFocus:
      return .autoFocus
    case .continuousAutoFocus:
      return .continuousAutoFocus
    }
  }
}
