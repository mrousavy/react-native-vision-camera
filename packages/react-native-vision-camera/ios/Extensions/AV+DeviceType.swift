///
/// AV+DeviceType.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension DeviceType {
  func toAVCaptureDeviceDeviceType() throws -> AVCaptureDevice.DeviceType {
    switch self {
    case .wideAngle:
      return .builtInWideAngleCamera
    case .ultraWideAngle:
      return .builtInUltraWideCamera
    case .telephoto:
      return .builtInTelephotoCamera
    case .dual:
      return .builtInDualCamera
    case .dualWide:
      return .builtInDualWideCamera
    case .triple:
      return .builtInTripleCamera
    case .continuity:
      guard #available(iOS 17.0, *) else {
        throw RuntimeError.error(withMessage: "\(self) is only available on iOS 17 or higher!")
      }
      return .continuityCamera
    case .lidarDepth:
      guard #available(iOS 15.4, *) else {
        throw RuntimeError.error(withMessage: "\(self) is only available on iOS 15.4 or higher!")
      }
      return .builtInLiDARDepthCamera
    case .trueDepth:
      guard #available(iOS 17.0, *) else {
        throw RuntimeError.error(withMessage: "\(self) is only available on iOS 17 or higher!")
      }
      return .builtInTrueDepthCamera
    case .external:
      guard #available(iOS 17.0, *) else {
        throw RuntimeError.error(withMessage: "\(self) is only available on iOS 17 or higher!")
      }
      return .external
    }
  }
}
