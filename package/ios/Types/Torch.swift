//
//  Torch.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import Foundation
import AVFoundation

/**
 A Torch used for permanent flash.
 */
enum Torch {
  /**
   Torch (flash unit) is always off.
   */
  case off
  /**
   Torch (flash unit) is always on.
   */
  case on

  init(fromTypeScriptUnion union: String) throws {
    switch union {
    case "on":
      self = .on
    case "off":
      self = .off
    default:
      throw CameraError.parameter(.invalid(unionName: "torch", receivedValue: union))
    }
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
