//
//  CameraView+focus.swift
//  mrousavy
//
//  Created by Marc Rousavy on 19.02.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import Foundation

extension CameraView {
  func focus(point: CGPoint) throws {
    guard let device = videoDeviceInput?.device else {
      throw CameraError.session(SessionError.cameraNotReady)
    }
    if !device.isFocusPointOfInterestSupported {
      throw CameraError.device(DeviceError.focusNotSupported)
    }

    let normalizedPoint = videoPreviewLayer.captureDevicePointConverted(fromLayerPoint: point)

    do {
      try device.lockForConfiguration()

      device.focusPointOfInterest = normalizedPoint
      device.focusMode = .continuousAutoFocus

      if device.isExposurePointOfInterestSupported {
        device.exposurePointOfInterest = normalizedPoint
        device.exposureMode = .continuousAutoExposure
      }

      device.unlockForConfiguration()
    } catch {
      throw CameraError.device(DeviceError.configureError)
    }
  }
}
