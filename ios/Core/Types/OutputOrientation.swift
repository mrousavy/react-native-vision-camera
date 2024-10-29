//
//  OutputOrientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 04.06.24.
//

import Foundation

@frozen
enum OutputOrientation: String, JSUnionValue {
  /**
   Automatically rotate outputs based on device physical rotation (even if screen-lock is on)
   */
  case device
  /**
   Automatically rotate outputs based on preview view's rotation (obides to screen-lock)
   */
  case preview

  init(jsValue: String) throws {
    if let parsed = OutputOrientation(rawValue: jsValue) {
      self = parsed
    } else {
      throw CameraError.parameter(.invalid(unionName: "outputOrientation", receivedValue: jsValue))
    }
  }

  var jsValue: String {
    return rawValue
  }
}
