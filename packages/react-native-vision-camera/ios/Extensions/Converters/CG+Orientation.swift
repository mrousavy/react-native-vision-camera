///
/// CG+Orientation.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation
import CoreGraphics

extension Orientation {
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
}
