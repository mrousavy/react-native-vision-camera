///
/// CIImage+toUIImage.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import CoreImage
import Foundation
import NitroModules

extension UIImage.Orientation {
  init(fromExif value: UInt32) throws {
    switch value {
    case 1:
      self = .up
    case 2:
      self = .upMirrored
    case 3:
      self = .down
    case 4:
      self = .downMirrored
    case 5:
      self = .leftMirrored
    case 6:
      self = .right
    case 7:
      self = .rightMirrored
    case 8:
      self = .left
    default:
      throw RuntimeError.error(withMessage: "Invalid EXIF Orientation Flag: \(value)")
    }
  }

  var isMirrored: Bool {
    switch self {
    case .up, .down, .left, .right:
      return false
    case .upMirrored, .downMirrored, .leftMirrored, .rightMirrored:
      return true
    @unknown default:
      fatalError("UIImage.Orientation has unknown value: \(self)")
    }
  }
}
