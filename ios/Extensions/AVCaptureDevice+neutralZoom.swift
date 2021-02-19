//
//  AVCaptureDevice+neutralZoom.swift
//  Cuvent
//
//  Created by Marc Rousavy on 10.01.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import AVFoundation

extension AVCaptureDevice {
  var neutralZoomFactor: CGFloat {
    if #available(iOS 13.0, *) {
      if let indexOfWideAngle = self.constituentDevices.firstIndex(where: { $0.deviceType == .builtInWideAngleCamera }) {
        if let zoomFactor = self.virtualDeviceSwitchOverVideoZoomFactors[safe: indexOfWideAngle - 1] {
          return CGFloat(zoomFactor.doubleValue)
        }
      }
    }
    return 1.0
  }

  /**
   Get the value at which the Zoom value is neutral, in percent (0.0-1.0)

   * On single-camera physical devices, this value will always be 0.0
   * On devices with multiple cameras, e.g. triple-camera, this value will be a value between 0.0 and 1.0, where the field-of-view and zoom looks "neutral"
   */
  var neutralZoomPercent: CGFloat {
    return (neutralZoomFactor - minAvailableVideoZoomFactor) / (maxAvailableVideoZoomFactor - minAvailableVideoZoomFactor)
  }
}
