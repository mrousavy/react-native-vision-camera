//
//  Torch.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

/**
 A Torch used for permanent flash.
 */
@frozen
enum Torch: String, JSUnionValue {
  /**
   Torch (flash unit) is always off.
   */
  case off
  /**
   Torch (flash unit) is always on.
   */
  case on

  init(jsValue: String) throws {
    if let parsed = Torch(rawValue: jsValue) {
      self = parsed
    } else {
      throw CameraError.parameter(.invalid(unionName: "torch", receivedValue: jsValue))
    }
  }

  var jsValue: String {
    return rawValue
  }

  func toTorchMode() -> AVCaptureDevice.TorchMode {
    switch self {
    case .on:
      return .on
    case .off:
      return .off
    }
  }
}
