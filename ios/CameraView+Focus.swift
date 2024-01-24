//
//  CameraView+focus.swift
//  mrousavy
//
//  Created by Marc Rousavy on 19.02.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import Foundation

extension CameraView {
  func focus(point: CGPoint, promise: Promise) {
    withPromise(promise) {
      guard let device = self.videoDeviceInput?.device else {
        throw CameraError.session(SessionError.cameraNotReady)
      }
      if !device.isFocusPointOfInterestSupported {
        throw CameraError.device(DeviceError.focusNotSupported)
      }

      let normalizedPoint = self.videoPreviewLayer.captureDevicePointConverted(fromLayerPoint: point)

      do {
        try device.lockForConfiguration()
        defer {
          device.unlockForConfiguration()
        }

        // Set Focus
        device.focusPointOfInterest = normalizedPoint
        device.focusMode = .autoFocus

        // Set Exposure
        if device.isExposurePointOfInterestSupported {
          device.exposurePointOfInterest = normalizedPoint
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

        return nil
      } catch {
        throw CameraError.device(DeviceError.configureError)
      }
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
