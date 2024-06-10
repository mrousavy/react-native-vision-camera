//
//  AVCaptureDevice+sensorOrientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 04.06.24.
//

import AVFoundation
import Foundation

extension AVCaptureDevice {
  /**
   Get the natural orientation of the camera sensor of this specific device.

   Note: On iOS, all sensors are landscape-left.
   */
  var sensorOrientation: Orientation {
    return .landscapeLeft
  }
}
