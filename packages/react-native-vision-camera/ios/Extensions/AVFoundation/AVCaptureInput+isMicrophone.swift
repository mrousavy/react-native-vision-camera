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
    // On iOS 16 with older devices (e.g. iPhone 8 / A11 chip), iterating
    // `AVCaptureSession.inputs` during a `beginConfiguration`/`commitConfiguration`
    // block can yield an `AVCaptureDeviceInput` whose underlying `device` has
    // already been deallocated. Calling `.deviceType` on a nil `device` causes
    // a SIGSEGV (KERN_INVALID_ADDRESS at 0x0). Guard against this before access.
    guard self.device != nil else {
      return false
    }
    if #available(iOS 17.0, *) {
      return self.device.deviceType == .microphone
    } else {
      return self.device.deviceType == .builtInMicrophone
    }
  }
}
