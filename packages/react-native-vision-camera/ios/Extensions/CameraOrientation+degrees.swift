///
/// CameraOrientation+degrees.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension CameraOrientation {
  init(degrees: Int) {
    let normalized = CameraOrientation.normalizeDegrees(degrees)
    switch normalized {
    case 45..<135:
      self = .right
    case 135..<225:
      self = .down
    case 225..<315:
      self = .left
    case 315..<360, 0..<45:
      self = .up
    default:
      fatalError("CameraOrientation: Invalid degrees (\(degrees)°) specified!")
    }
  }

  var degrees: Int {
    switch self {
    case .up:
      return 0
    case .left:
      return 270
    case .right:
      return 90
    case .down:
      return 180
    }
  }

  func rotatedBy(degrees: Int) -> CameraOrientation {
    let newDegrees = self.degrees + degrees
    return CameraOrientation(degrees: newDegrees)
  }

  func rotatedBy(_ orientation: CameraOrientation) -> CameraOrientation {
    return self.rotatedBy(degrees: orientation.degrees)
  }

  func relativeTo(_ orientation: CameraOrientation) -> CameraOrientation {
    return self.rotatedBy(degrees: -orientation.degrees)
  }

  @inline(__always)
  private static func normalizeDegrees(_ degrees: Int) -> Int {
    let normalized = degrees % 360
    if normalized < 0 {
      return normalized + 360
    }
    return normalized
  }
}
