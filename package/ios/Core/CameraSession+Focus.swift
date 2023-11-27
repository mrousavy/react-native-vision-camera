//
//  CameraSession+Focus.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension CameraSession {
  /**
   Focuses the Camera to the specified point. The point must be in the Camera coordinate system, so {0...1} on both axis.
   */
  func focus(options: FocusOptions) throws {
    guard let device = videoDeviceInput?.device else {
      throw CameraError.session(SessionError.cameraNotReady)
    }
    if !device.isFocusPointOfInterestSupported {
      throw CameraError.device(DeviceError.focusNotSupported)
    }

    ReactLogger.log(level: .info, message: "Focusing \(options.point) (\(options.modes))...")

    do {
      try device.lockForConfiguration()
      defer {
        device.unlockForConfiguration()
      }

      // Set Focus
      if options.modes.contains(.af) && device.isFocusPointOfInterestSupported {
        device.focusPointOfInterest = options.point
        device.focusMode = .autoFocus
      }
      
      // Set Exposure
      if options.modes.contains(.ae) && device.isExposurePointOfInterestSupported {
        device.exposurePointOfInterest = options.point
        device.exposureMode = .autoExpose
      }

      // Remove any existing listeners
      NotificationCenter.default.removeObserver(self,
                                                name: NSNotification.Name.AVCaptureDeviceSubjectAreaDidChange,
                                                object: nil)

      // Listen for focus completion
      device.isSubjectAreaChangeMonitoringEnabled = true
      NotificationCenter.default.addObserver(self,
                                             selector: #selector(subjectAreaDidChange),
                                             name: NSNotification.Name.AVCaptureDeviceSubjectAreaDidChange,
                                             object: nil)
    } catch {
      throw CameraError.device(DeviceError.configureError)
    }
  }

  @objc
  func subjectAreaDidChange(notification _: NSNotification) {
    guard let device = videoDeviceInput?.device else {
      return
    }

    try? device.lockForConfiguration()
    defer {
      device.unlockForConfiguration()
    }

    // Reset Focus to continuous/auto
    if device.isFocusPointOfInterestSupported {
      device.focusMode = .continuousAutoFocus
    }

    // Reset Exposure to continuous/auto
    if device.isExposurePointOfInterestSupported {
      device.exposureMode = .continuousAutoExposure
    }

    // Disable listeners
    device.isSubjectAreaChangeMonitoringEnabled = false
  }
}
