///
/// AV+DeviceType.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension DeviceType {
  init(type: AVCaptureDevice.DeviceType) throws {
    switch type {
    case .builtInWideAngleCamera:
      self = .wideAngle
    case .builtInUltraWideCamera:
      self = .ultraWideAngle
    case .builtInTelephotoCamera:
      self = .telephoto
    case .builtInDualCamera:
      self = .dual
    case .builtInDualWideCamera:
      self = .dualWide
    case .builtInTripleCamera:
      self = .triple
    case .builtInTrueDepthCamera:
      self = .trueDepth
    default:
      if #available(iOS 15.4, *), type == .builtInLiDARDepthCamera {
        self = .lidarDepth
      } else if #available(iOS 17.0, *) {
        switch type {
        case .continuityCamera:
          self = .continuity
        case .external:
          self = .external
        default:
          throw RuntimeError.error(withMessage: "Unknown DeviceType \(type)!")
        }
      } else {
        throw RuntimeError.error(withMessage: "Unknown DeviceType \(type)!")
      }
    }
  }
  
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
    case .trueDepth:
      return .builtInTrueDepthCamera
    case .lidarDepth:
      guard #available(iOS 15.4, *) else {
        throw RuntimeError.error(withMessage: "\(self) is only available on iOS 15.4 or higher!")
      }
      return .builtInLiDARDepthCamera
    case .continuity:
      guard #available(iOS 17.0, *) else {
        throw RuntimeError.error(withMessage: "\(self) is only available on iOS 17 or higher!")
      }
      return .continuityCamera
    case .external:
      guard #available(iOS 17.0, *) else {
        throw RuntimeError.error(withMessage: "\(self) is only available on iOS 17 or higher!")
      }
      return .external
    }
  }
}
