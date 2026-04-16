///
/// AV+TargetStabilizationMode.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension TargetStabilizationMode {
  func toAVCaptureVideoStabilizationMode() -> AVCaptureVideoStabilizationMode {
    switch self {
    case .off:
      return .off
    case .auto:
      return .auto
    case .standard:
      return .standard
    case .cinematic:
      return .cinematic
    case .cinematicExtended:
      return .cinematicExtended
    case .cinematicExtendedEnhanced:
      if #available(iOS 18.0, *) {
        return .cinematicExtendedEnhanced
      } else {
        return .cinematicExtended
      }
    case .previewOptimized:
      if #available(iOS 17.0, *) {
        return .previewOptimized
      } else {
        return .standard
      }
    case .lowLatency:
      if #available(iOS 26.0, *) {
        return .lowLatency
      } else {
        return .standard
      }
    }
  }
}
