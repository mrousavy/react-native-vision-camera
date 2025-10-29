///
/// AVCaptureDevice.DeviceType+all.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

extension AVCaptureDevice.DeviceType {
  /**
   * Returns a list of all available `DeviceType`s.
   * This list should be kept up to date by just adding new device types here.
   */
  static var all: [AVCaptureDevice.DeviceType] {
    var devices: [AVCaptureDevice.DeviceType] = []

    devices.append(.builtInWideAngleCamera)
    devices.append(.builtInUltraWideCamera)
    devices.append(.builtInTelephotoCamera)
    devices.append(.builtInDualCamera)
    devices.append(.builtInDualWideCamera)
    devices.append(.builtInTripleCamera)

    if #available(iOS 17.0, *) {
      devices.append(.continuityCamera)
      devices.append(.external)
    }

#if os(macOS)
    devices.append(.deskViewCamera)
#endif

    if #available(iOS 15.4, *) {
      devices.append(.builtInLiDARDepthCamera)
    }
    devices.append(.builtInTrueDepthCamera)

    return devices
  }
}
