///
/// AV+Orientation.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension Orientation {
  init(avOrientation: AVCaptureVideoOrientation) {
    switch avOrientation {
    case .portrait:
      self = .up
    case .portraitUpsideDown:
      self = .down
    case .landscapeRight:
      self = .left
    case .landscapeLeft:
      self = .right
    @unknown default:
      fatalError("AVCaptureVideoOrientation has unknown value: \(avOrientation)")
    }
  }

  func toAVCaptureVideoOrientation() -> AVCaptureVideoOrientation {
    switch self {
    case .up:
      return .portrait
    case .down:
      return .portraitUpsideDown
    case .left:
      return .landscapeRight
    case .right:
      return .landscapeLeft
    }
  }
}
