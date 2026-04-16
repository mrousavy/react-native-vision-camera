///
/// AVCaptureSession+addConnection.swift
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
  func addConnection(input: any HybridCameraDeviceSpec, output: any HybridCameraOutputSpec) throws {
    // 1. Get the `AVCaptureDeviceInput` for our `input`
    let deviceInput = try findDevice(for: input)

    // 2. Create the `AVCaptureConnection` (either output or preview, we have an extension init)
    let connection = try AVCaptureConnection(input: deviceInput, output: output)

    // 3. Add it!
    guard self.canAddConnection(connection) else {
      throw RuntimeError.error(
        withMessage: "Connection \"\(connection)\" cannot be added to Camera Session!")
    }
    logger.info("Adding Connection \(connection)...")
    self.addConnection(connection)
  }
}
