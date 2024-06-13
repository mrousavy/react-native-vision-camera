//
//  AVCaptureDevice+sensorOrientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 04.06.24.
//

import AVFoundation
import Foundation

// Note: On iOS, all sensors are landscape-left.
let DEFAULT_SENSOR_ORIENTATION: Orientation = .landscapeLeft

extension AVCaptureDevice {
  /**
   Get the natural orientation of the camera sensor of this specific device.
   */
  var sensorOrientation: Orientation {
    return DEFAULT_SENSOR_ORIENTATION
  }
}
