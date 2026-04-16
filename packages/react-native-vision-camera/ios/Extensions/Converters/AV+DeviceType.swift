///
/// AV+DeviceType.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension DeviceType {
  init(type: AVCaptureDevice.DeviceType) {
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
      if #available(iOS 15.4, *) {
        if type == .builtInLiDARDepthCamera {
          self = .lidarDepth
          return
        }
      }
      if #available(iOS 17.0, *) {
        if type == .continuityCamera {
          self = .continuity
          return
        }
        if type == .external {
          self = .external
          return
        }
      }
      logger.error("VisionCamera: Unknown DeviceType: \(type.rawValue)!")
      self = .unknown
    }
  }
}
