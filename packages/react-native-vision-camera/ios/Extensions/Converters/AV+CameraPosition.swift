///
/// AV+CameraPosition.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension CameraPosition {
  init(position: AVCaptureDevice.Position) {
    switch position {
    case .unspecified:
      self = .unspecified
    case .back:
      self = .back
    case .front:
      self = .front
    @unknown default:
      logger.error("Unknown Device Position: \(position.rawValue)")
      self = .unspecified
    }
  }

  func toAVCaptureDevicePosition() -> AVCaptureDevice.Position {
    switch self {
    case .back:
      return .back
    case .front:
      return .front
    case .unspecified:
      return .unspecified
    case .external:
      // External is not supported on iOS
      return .unspecified
    }
  }
}
