//
//  Flash.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 25.07.24.
//

import AVFoundation
import Foundation

/**
 A Flash for Photo capture.
 */
@frozen
enum Flash: String, JSUnionValue {
  /**
   Flash never fires.
   */
  case off
  /**
   Flash always fires, no matter the lighting conditions
   */
  case on
  /**
   Flash fires if lighting conditions are too dark.
   */
  case auto

  init(jsValue: String) throws {
    if let parsed = Flash(rawValue: jsValue) {
      self = parsed
    } else {
      throw CameraError.parameter(.invalid(unionName: "flash", receivedValue: jsValue))
    }
  }

  var jsValue: String {
    return rawValue
  }

  func toFlashMode() -> AVCaptureDevice.FlashMode {
    switch self {
    case .on:
      return .on
    case .off:
      return .off
    case .auto:
      return .auto
    }
  }
}
