//
//  Orientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

/**
 The Orientation used for the Preview, Photo, Video and Frame Processor outputs.
 */
enum Orientation {
  /**
   Phone is in upright portrait mode, home button/indicator is at the bottom
   */
  case portrait
  /**
   Phone is in landscape mode, home button/indicator is on the left
   */
  case landscapeLeft
  /**
   Phone is in upside-down portrait mode, home button/indicator is at the top
   */
  case portraitUpsideDown
  /**
   Phone is in landscape mode, home button/indicator is on the right
   */
  case landscapeRight

  init(fromTypeScriptUnion union: String) throws {
    switch union {
    case "portrait":
      self = .portrait
    case "landscape-left":
      self = .landscapeLeft
    case "portrait-upside-down":
      self = .portraitUpsideDown
    case "landscapeRight":
      self = .landscapeRight
    default:
      throw CameraError.parameter(.invalid(unionName: "orientation", receivedValue: union))
    }
  }
}
