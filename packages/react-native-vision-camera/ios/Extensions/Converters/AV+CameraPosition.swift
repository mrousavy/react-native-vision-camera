///
/// AV+CameraPosition.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

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
      print("Unknown Device Position: \(position)")
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
    }
  }
}
