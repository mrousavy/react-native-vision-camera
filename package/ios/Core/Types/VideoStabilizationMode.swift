//
//  VideoStabilizationMode.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 13.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

@frozen
enum VideoStabilizationMode: String, JSUnionValue {
  case off
  case standard
  case cinematic
  case cinematicExtended = "cinematic-extended"
  case auto

  init(jsValue: String) throws {
    if let parsed = VideoStabilizationMode(rawValue: jsValue) {
      self = parsed
    } else {
      throw CameraError.parameter(.invalid(unionName: "videoStabilizationMode", receivedValue: jsValue))
    }
  }

  init(from mode: AVCaptureVideoStabilizationMode) {
    switch mode {
    case .off:
      self = .off
    case .standard:
      self = .standard
    case .cinematic:
      self = .cinematic
    case .cinematicExtended:
      self = .cinematicExtended
    case .auto:
      self = .auto
    default:
      self = .off
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
      if #available(iOS 13.0, *) {
        return .cinematicExtended
      } else {
        return .cinematic
      }
    case .auto:
      return .auto
    }
  }

  var jsValue: String {
    return rawValue
  }
}
