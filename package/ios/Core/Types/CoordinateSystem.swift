//
//  CoordinateSystem.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 17.07.24.
//

import Foundation

@frozen
enum CoordinateSystem: String, JSUnionValue {
  case previewView = "preview-view"
  case camera = "camera"

  init(jsValue: String) throws {
    if let parsed = CoordinateSystem(rawValue: jsValue) {
      self = parsed
    } else {
      throw CameraError.parameter(.invalid(unionName: "hardwareLevel", receivedValue: jsValue))
    }
  }

  var jsValue: String {
    return rawValue
  }
}
