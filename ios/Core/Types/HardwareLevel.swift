//
//  HardwareLevel.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 04.06.24.
//

import Foundation

@frozen
enum HardwareLevel: String, JSUnionValue {
  case full

  init(jsValue: String) throws {
    if let parsed = HardwareLevel(rawValue: jsValue) {
      self = parsed
    } else {
      throw CameraError.parameter(.invalid(unionName: "hardwareLevel", receivedValue: jsValue))
    }
  }

  var jsValue: String {
    return rawValue
  }
}
