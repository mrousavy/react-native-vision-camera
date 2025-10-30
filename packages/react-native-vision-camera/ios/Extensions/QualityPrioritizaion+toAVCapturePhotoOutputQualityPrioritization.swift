///
/// QualityPrioritizaion+toAVCapturePhotoOutputQualityPrioritization.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension QualityPrioritization {
  func toAVCapturePhotoOutputQualityPrioritization() -> AVCapturePhotoOutput.QualityPrioritization {
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
