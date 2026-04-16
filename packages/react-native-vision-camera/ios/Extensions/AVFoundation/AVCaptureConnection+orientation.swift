///
/// AVCaptureConnection+orientation.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureConnection {
  var orientation: Orientation {
    return Orientation(avOrientation: videoOrientation)
  }

  func setOrientation(_ orientation: Orientation) throws {
    guard self.isVideoOrientationSupported else {
      throw RuntimeError.error(
        withMessage:
          "Cannot set orientation=\"\(orientation.stringValue)\" - this connection does not support orientation changing"
      )
    }
    self.videoOrientation = orientation.toAVCaptureVideoOrientation()
  }
}
