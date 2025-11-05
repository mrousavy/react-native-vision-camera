///
/// AVCaptureConnection+orientation.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension AVCaptureConnection {
  var orientation: Orientation {
    switch videoOrientation {
    case .portrait:
      return .up
    case .portraitUpsideDown:
      return .down
    case .landscapeLeft:
      return .left
    case .landscapeRight:
      return .right
    @unknown default:
      print("AVCaptureConnection has unknown orientation!")
      return .up
    }
  }
}
