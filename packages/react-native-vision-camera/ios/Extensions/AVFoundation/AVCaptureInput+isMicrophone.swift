///
/// AVCaptureInput+isMicrophone.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureInput {
  var isMicrophone: Bool {
    guard let self = self as? AVCaptureDeviceInput else {
      return false
    }
    return self.device.hasMediaType(.audio)
  }
}
