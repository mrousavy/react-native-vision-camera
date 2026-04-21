///
/// CG+CameraOrientation.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import CoreGraphics
import Foundation
import NitroModules

extension CameraOrientation {
  func toCGOrientation(isMirrored: Bool) -> CGImagePropertyOrientation {
    switch self {
    case .up:
      return isMirrored ? .upMirrored : .up
    case .down:
      return isMirrored ? .downMirrored : .down
    case .left:
      return isMirrored ? .leftMirrored : .left
    case .right:
      return isMirrored ? .rightMirrored : .right
    }
  }

  var affineTransform: CGAffineTransform {
    switch self {
    case .up:
      return .identity
    case .left:
      return CGAffineTransform(rotationAngle: .pi / 2)
    case .down:
      return CGAffineTransform(rotationAngle: .pi)
    case .right:
      return CGAffineTransform(rotationAngle: -(.pi / 2))
    }
  }
}
