///
/// AV+CameraPosition.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension CameraPosition {
  func toAVCaptureDevicePosition() -> AVCaptureDevice.Position {
    switch self {
    case .back:
      return .back
    case .front:
      return .front
    case .unspecified:
      return .unspecified
    }
  }
}
