//
//  OutputOrientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 04.06.24.
//

import Foundation

enum OutputOrientation: String, JSUnionValue {
  /**
   Automatically rotate outputs based on device physical rotation (even if screen-lock is on)
   */
  case device
  /**
   Automatically rotate outputs based on preview view's rotation (obides to screen-lock)
   */
  case preview
  /**
   Fixed to portrait (0°, home-button on the bottom)
   */
  case portrait
  /**
   Fixed to landscape-left (90°, home-button on the left)
   */
  case landscapeLeft = "landscape-left"
  /**
   Fixed to portrait-upside-down (180°, home-button on the top)
   */
  case portraitUpsideDown = "portrait-upside-down"
  /**
   Fixed to landscape-right (270°, home-button on the right)
   */
  case landscapeRight = "landscape-right"

  init(jsValue: String) throws {
    if let parsed = OutputOrientation(rawValue: jsValue) {
      self = parsed
    } else {
      throw CameraError.parameter(.invalid(unionName: "orientation", receivedValue: jsValue))
    }
  }

  var jsValue: String {
    return rawValue
  }

  /**
   If the orientation is locked to a specific orientation, this will return the according Orientation.
   If the orientation is dynamic/automatic (device/preview), this will return nil.
   */
  var lockedOrientation: Orientation? {
    switch self {
    case .portrait:
      return .portrait
    case .landscapeLeft:
      return .landscapeLeft
    case .portraitUpsideDown:
      return .portraitUpsideDown
    case .landscapeRight:
      return .landscapeRight
    default:
      return nil
    }
  }
}
