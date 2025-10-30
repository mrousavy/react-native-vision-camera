///
/// FlashMode+toAVCaptureDeviceFlashMode.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension FlashMode {
  func toAVCaptureDeviceFlashMode() -> AVCaptureDevice.FlashMode {
    switch self {
      case .off:
      return .off
      case .on:
      return .on
      case .auto:
      return .auto
    }
  }
}
