//
//  Orientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation
import UIKit

/**
 The Orientation used for the Preview, Photo, Video and Frame Processor outputs.
 */
@frozen
public enum Orientation: String, JSUnionValue {
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
    let normalized = Orientation.normalizeDegrees(degrees)
    switch normalized {
    case 45 ..< 135:
      self = .landscapeLeft
    case 135 ..< 225:
      self = .portraitUpsideDown
    case 225 ..< 315:
      self = .landscapeRight
    case 315 ..< 360, 0 ..< 45:
      self = .portrait
    default:
      fatalError("Orientation: Invalid degrees (\(degrees)°) specified!")
    }
  }

  init(deviceOrientation: UIDeviceOrientation) {
    switch deviceOrientation {
    case .portrait:
      self = .portrait
    case .landscapeRight:
      self = .landscapeRight
    case .portraitUpsideDown:
      self = .portraitUpsideDown
    case .landscapeLeft:
      self = .landscapeLeft
    default:
      self = .portrait
    }
  }

  init(videoOrientation: AVCaptureVideoOrientation) {
    switch videoOrientation {
    case .portrait:
      self = .portrait
    case .landscapeRight:
      self = .landscapeRight
    case .portraitUpsideDown:
      self = .portraitUpsideDown
    case .landscapeLeft:
      self = .landscapeLeft
    default:
      self = .portrait
    }
  }

  init(interfaceOrientation: UIInterfaceOrientation) {
    switch interfaceOrientation {
    case .portrait:
      self = .portrait
    case .landscapeRight:
      // Interface orientation landscapeRight is the opposite of device orientation
      self = .landscapeLeft
    case .portraitUpsideDown:
      self = .portraitUpsideDown
    case .landscapeLeft:
      // Interface orientation landscapeLeft is the opposite of device orientation
      self = .landscapeRight
    default:
      self = .portrait
    }
  }

  var jsValue: String {
    return rawValue
  }

  var affineTransform: CGAffineTransform {
    switch self {
    case .portrait:
      return .identity
    case .landscapeLeft:
      return CGAffineTransform(rotationAngle: .pi / 2)
    case .portraitUpsideDown:
      return CGAffineTransform(rotationAngle: .pi)
    case .landscapeRight:
      return CGAffineTransform(rotationAngle: -(.pi / 2))
    }
  }

  var videoOrientation: AVCaptureVideoOrientation {
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

  var imageOrientation: UIImage.Orientation {
    switch self {
    case .portrait:
      return .up
    case .landscapeLeft:
      return .right
    case .portraitUpsideDown:
      return .down
    case .landscapeRight:
      return .left
    }
  }

  var degrees: Double {
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

  @inline(__always)
  var isPortrait: Bool {
    return self == .portrait || self == .portraitUpsideDown
  }

  @inline(__always)
  var isLandscape: Bool {
    return self == .landscapeLeft || self == .landscapeRight
  }

  @inline(__always)
  func rotatedBy(degrees: Double) -> Orientation {
    return Orientation(degrees: self.degrees + degrees)
  }

  @inline(__always)
  func rotatedBy(orientation: Orientation) -> Orientation {
    return rotatedBy(degrees: orientation.degrees)
  }

  @inline(__always)
  func flipped() -> Orientation {
    return rotatedBy(degrees: 180)
  }

  @inline(__always)
  func relativeTo(orientation: Orientation) -> Orientation {
    return rotatedBy(degrees: -orientation.degrees)
  }

  @inline(__always)
  static func normalizeDegrees(_ degrees: Double) -> Double {
    let normalized = degrees.truncatingRemainder(dividingBy: 360)
    if normalized < 0 {
      return normalized + 360
    }
    return normalized
  }
}
