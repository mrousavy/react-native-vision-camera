///
/// AV+QualityPrioritization.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension QualityPrioritization {
  func toAVQualityPrioritization() -> AVCapturePhotoOutput.QualityPrioritization {
    switch self {
    case .speed:
      return .speed
    case .balanced:
      return .balanced
    case .quality:
      return .quality
    }
  }
}
