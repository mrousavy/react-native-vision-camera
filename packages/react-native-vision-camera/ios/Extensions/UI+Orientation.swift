///
/// UI+Orientation.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension Orientation {
  func toUIImageOrientation() -> UIImage.Orientation {
    switch self {
    case .up:
      return .up
    case .down:
      return .down
    case .left:
      return .left
    case .right:
      return .right
    }
  }
}
