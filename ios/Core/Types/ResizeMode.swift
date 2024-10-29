//
//  ResizeMode.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 22.09.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

/**
 A ResizeMode used for the PreviewView.
 */
@frozen
enum ResizeMode: String, JSUnionValue {
  /**
   Keep aspect ratio, but fill entire parent view (centered).
   */
  case cover
  /**
   Keep aspect ratio, but make sure the entire content is visible even if it introduces additional blank areas (centered).
   */
  case contain

  init(jsValue: String) throws {
    if let parsed = ResizeMode(rawValue: jsValue) {
      self = parsed
    } else {
      throw CameraError.parameter(.invalid(unionName: "resizeMode", receivedValue: jsValue))
    }
  }

  var jsValue: String {
    return rawValue
  }
}
