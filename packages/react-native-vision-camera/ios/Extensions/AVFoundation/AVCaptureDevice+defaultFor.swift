///
/// AVCaptureDevice+defaultFor.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureDevice {
  static func `default`(for position: TargetCameraPosition) -> AVCaptureDevice? {
    switch position {
    case .back:
      // Get default wide-angle at .back
      return AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back)
    case .front:
      // Get default wide-angle at .front
      return AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front)
    case .external:
      // On iOS, Position "external" is for some reason reflected on the .deviceType, not on .position.
      guard #available(iOS 17.0, *) else {
        return nil
      }
      return AVCaptureDevice.default(.external, for: .video, position: .unspecified)
    }
  }
}
