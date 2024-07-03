//
//  AutoFocusSystem.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 13.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

@frozen
enum AutoFocusSystem: String, JSUnionValue {
  case contrastDetection = "contrast-detection"
  case phaseDetection = "phase-detection"
  case none

  init(jsValue: String) throws {
    if let parsed = AutoFocusSystem(rawValue: jsValue) {
      self = parsed
    } else {
      throw CameraError.parameter(.invalid(unionName: "autoFocusSystem", receivedValue: jsValue))
    }
  }

  init(fromFocusSystem focusSystem: AVCaptureDevice.Format.AutoFocusSystem) {
    switch focusSystem {
    case .none:
      self = .none
    case .contrastDetection:
      self = .contrastDetection
    case .phaseDetection:
      self = .phaseDetection
    @unknown default:
      self = .none
    }
  }

  var jsValue: String {
    return rawValue
  }
}
