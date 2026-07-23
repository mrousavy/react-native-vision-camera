///
/// UIImageOrientation+inverted.swift
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

import Foundation
import UIKit

extension UIImage.Orientation {
  /**
   * Gets the inverse of this orientation.
   *
   * Applying the inverted orientation's transform undoes this
   * orientation's transform. The pure 90° rotations (`.left`/`.right`)
   * are each other's inverse, while the identity, the 180° rotation and
   * all reflections (`*Mirrored`) are their own inverse.
   */
  var inverted: UIImage.Orientation {
    switch self {
    case .left:
      return .right
    case .right:
      return .left
    case .up, .down, .upMirrored, .downMirrored, .leftMirrored, .rightMirrored:
      return self
    @unknown default:
      fatalError("UIImage.Orientation has unknown value: \(self)")
    }
  }
}
