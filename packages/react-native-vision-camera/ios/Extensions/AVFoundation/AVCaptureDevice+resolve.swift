///
/// AVCaptureDevice+defaultFor.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureDevice {
  static func resolve(value: CameraDeviceOrPosition) throws -> AVCaptureDevice {
    switch value {
    case .first(let hybridCameraDeviceSpec):
      guard let device = hybridCameraDeviceSpec as? any NativeCameraDevice else {
        throw RuntimeError("CameraDevice \"\(hybridCameraDeviceSpec)\" is not of type `NativeCameraDevice`!")
      }
      return device.device
    case .second(let targetCameraPosition):
      guard let device = AVCaptureDevice.default(for: targetCameraPosition) else {
        throw RuntimeError("No CameraDevice exists at position \"\(targetCameraPosition)\"!")
      }
      return device
    }
  }
}
