///
/// AVCaptureSession+findDevice.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

// TODO: All of those extension deal with the *Spec protocols - we do
//       a lot of runtime downcasting here, which could be avoided.
//       Do we want to refactor this to use `AVCaptureDevice` or at least
//       `NativeCameraDevice` directly, and only unwrap once in the caller?

extension AVCaptureSession {
  func findDevice(for input: CameraDeviceOrPosition) throws -> AVCaptureDeviceInput {
    let device = try AVCaptureDevice.resolve(value: input)
    return try findDevice(for: device)
  }
  
  func findDevice(for device: AVCaptureDevice) throws -> AVCaptureDeviceInput {
    for attachedInput in self.inputs {
      guard let attachedInput = attachedInput as? AVCaptureDeviceInput else {
        continue
      }
      if attachedInput.device == device {
        // 3. We found it! Return
        return attachedInput
      }
    }
    
    // We didn't find it!
    throw RuntimeError("The given device \"\(device)\" is not yet attached to the `CameraSession` - cannot form a connection yet!")
  }
}
