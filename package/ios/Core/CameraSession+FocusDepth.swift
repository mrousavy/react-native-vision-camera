//
//  CameraSession+FocusDepth.swift
//  VisionCamera
//
//  Created by Hugo Gresse on 12.08.25.
//

import AVFoundation
import Foundation

extension CameraSession {
  /**
   Focuses the Camera to the specified distance. The distance must be within 0.001f and device.minFocusDistance
   */
  func focusDepth(distance: Float) throws {
    guard let device = videoDeviceInput?.device else {
      throw CameraError.session(SessionError.cameraNotReady)
    }
    if !device.isLockingFocusWithCustomLensPositionSupported {
      throw CameraError.device(DeviceError.focusDepthNotSupported)
    }

    VisionLogger.log(level: .info, message: "Focusing depth (\(distance))...")

    do {
      try device.lockForConfiguration()
      defer {
        device.unlockForConfiguration()
      }

      // Set Focus depth
      device.setFocusModeLocked(lensPosition: distance, completionHandler: nil)
    } catch {
      throw CameraError.device(DeviceError.configureError)
    }
  }
}
