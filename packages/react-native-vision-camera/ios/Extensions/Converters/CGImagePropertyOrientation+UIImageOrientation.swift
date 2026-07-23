///
/// CGImagePropertyOrientation+UIImageOrientation.swift
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

import Foundation
import ImageIO
import UIKit

extension CGImagePropertyOrientation {
  init(_ uiOrientation: UIImage.Orientation) {
    switch uiOrientation {
    case .up:
      self = .up
    case .upMirrored:
      self = .upMirrored
    case .down:
      self = .down
    case .downMirrored:
      self = .downMirrored
    case .left:
      self = .left
    case .leftMirrored:
      self = .leftMirrored
    case .right:
      self = .right
    case .rightMirrored:
      self = .rightMirrored
    @unknown default:
      fatalError("UIImage.Orientation has unknown value: \(uiOrientation)")
    }
  }
}
