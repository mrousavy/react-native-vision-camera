//
//  ShutterType.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 07.03.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

import Foundation

/**
 Represents the type of media that was captured in a `onShutter` event
 */
@frozen
enum ShutterType: String, JSUnionValue {
  /**
   A photo was captured on this `onShutter` event
   */
  case photo
  /**
   A snapshot was captured on this `onShutter` event
   */
  case snapshot

  init(jsValue: String) throws {
    if let parsed = ShutterType(rawValue: jsValue) {
      self = parsed
    } else {
      throw CameraError.parameter(.invalid(unionName: "shutterType", receivedValue: jsValue))
    }
  }

  var jsValue: String {
    return rawValue
  }
}
