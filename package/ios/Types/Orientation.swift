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
enum Orientation: String, JSUnionValue {
  /**
   Phone is in upright portrait mode, home button/indicator is at the bottom
   */
  case portrait
  /**
   Phone is in landscape mode, home button/indicator is on the left
   */
  case landscapeLeft = "landscape-left"
  /**
   Phone is in upside-down portrait mode, home button/indicator is at the top
   */
  case portraitUpsideDown = "portrait-upside-down"
  /**
   Phone is in landscape mode, home button/indicator is on the right
   */
  case landscapeRight = "landscape-right"

  init(jsValue: String) throws {
    if let parsed = Orientation(rawValue: jsValue) {
      self = parsed
    } else {
      throw CameraError.parameter(.invalid(unionName: "orientation", receivedValue: jsValue))
    }
  }

  var jsValue: String {
    return rawValue
  }

  func toAVCaptureVideoOrientation() -> AVCaptureVideoOrientation {
    switch self {
    case .portrait:
      return .portrait
    case .landscapeLeft:
      return .landscapeLeft
    case .portraitUpsideDown:
      return .portraitUpsideDown
    case .landscapeRight:
      return .landscapeRight
    }
  }

  func toDegrees() -> Double {
    switch self {
    case .portrait:
      return 0
    case .landscapeLeft:
      return 90
    case .portraitUpsideDown:
      return 180
    case .landscapeRight:
      return 270
    }
  }

  func rotateRight() -> Orientation {
    switch self {
    case .portrait:
      return .landscapeLeft
    case .landscapeLeft:
      return .portraitUpsideDown
    case .portraitUpsideDown:
      return .landscapeRight
    case .landscapeRight:
      return .portrait
    }
  }
}
