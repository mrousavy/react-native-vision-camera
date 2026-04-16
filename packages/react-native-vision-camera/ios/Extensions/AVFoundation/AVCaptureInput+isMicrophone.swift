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
    if #available(iOS 17.0, *) {
      return self.device.deviceType == .microphone
    } else {
      return self.device.deviceType == .builtInMicrophone
    }
  }
}
