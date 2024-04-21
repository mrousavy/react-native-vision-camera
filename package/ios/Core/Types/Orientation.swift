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

  init(degrees: Double) {
    switch degrees {
    case 45 ..< 135:
      self = .landscapeLeft
    case 135 ..< 225:
      self = .portraitUpsideDown
    case 225 ..< 315:
      self = .landscapeRight
    default:
      self = .portrait
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

  func rotateBy(orientation: Orientation) -> Orientation {
    let added = toDegrees() + orientation.toDegrees()
    let degress = added.truncatingRemainder(dividingBy: 360)
    return Orientation(degrees: degress)
  }
}
