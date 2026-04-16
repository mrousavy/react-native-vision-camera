///
/// AVCaptureConnection+mirrorMode.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureConnection {
  func setMirrorMode(_ mirrorMode: MirrorMode) throws {
    switch mirrorMode {
    case .auto:
      self.automaticallyAdjustsVideoMirroring = true
    case .on:
      guard self.isVideoMirroringSupported else {
        throw RuntimeError.error(
          withMessage:
            "Cannot set mirrorMode=\"\(mirrorMode.stringValue)\" - this connection does not support video mirroring!"
        )
      }
      self.automaticallyAdjustsVideoMirroring = false
      self.isVideoMirrored = true
    case .off:
      guard self.isVideoMirroringSupported else {
        // Mirroring is not supported, but setting it to `false` may still throw. So just ignore
        return
      }
      self.automaticallyAdjustsVideoMirroring = false
      self.isVideoMirrored = false
    }
  }
}
