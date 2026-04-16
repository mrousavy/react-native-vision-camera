///
/// UI+Orientation.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import UIKit
import VisionCamera

extension Orientation {
  func toUIImageOrientation(isMirrored: Bool = false) -> UIImage.Orientation {
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
