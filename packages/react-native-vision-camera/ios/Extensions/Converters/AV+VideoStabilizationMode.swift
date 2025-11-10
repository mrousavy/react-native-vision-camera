///
/// AutoFocusSystem+toAVAutoFocusSystem.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension VideoStabilizationMode {
  init(mode: AVCaptureVideoStabilizationMode) {
    switch mode {
    case .off:
      self = .off
    case .standard:
      self = .standard
    case .cinematic:
      self = .cinematic
    case .cinematicExtended:
      self = .cinematicExtended
    case .previewOptimized:
      self = .previewOptimized
    case .cinematicExtendedEnhanced:
      self = .cinematicExtendedEnhanced
    case .lowLatency:
      self = .lowLatency
    case .auto:
      self = .auto
    @unknown default:
      print("Discovered unknown video stabilization mode! \(mode)")
      self = .auto
    }
  }

  func toAVCaptureVideoStabilizationMode() -> AVCaptureVideoStabilizationMode {
    switch self {
    case .off:
      return .off
    case .standard:
      return .standard
    case .cinematic:
      return .cinematic
    case .cinematicExtended:
      return .cinematicExtended
    case .previewOptimized:
      if #available(iOS 17.0, *) {
        return .previewOptimized
      } else {
        return .auto
      }
    case .cinematicExtendedEnhanced:
      if #available(iOS 18.0, *) {
        return .cinematicExtendedEnhanced
      } else {
        return .auto
      }
    case .auto:
      return .auto
    case .lowLatency:
      if #available(iOS 26.0, *) {
        return .lowLatency
      } else {
        return .auto
      }
    }
  }
}
