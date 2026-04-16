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
  func findDevice(for input: any HybridCameraDeviceSpec) throws -> AVCaptureDeviceInput {
    // 1. Downcast input
    guard let input = input as? any NativeCameraDevice else {
      throw RuntimeError.error(
        withMessage: "Input \"\(input)\" is not of type `NativeCameraDevice`!")
    }
    // 2. Get a device-input
    for attachedInput in self.inputs {
      guard let attachedInput = attachedInput as? AVCaptureDeviceInput else {
        continue
      }
      if attachedInput.device == input.device {
        // 3. We found it! Return
        return attachedInput
      }
    }
    // 4. We didn't find the device because it is not attached to the `CameraSession` yet. Throw.
    throw RuntimeError.error(
      withMessage:
        "The given input \"\(input)\" is not yet attached to the `CameraSession` - cannot form a connection yet!"
    )
  }
}
