//
//  AVCaptureDevice+sensorOrientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 04.06.24.
//

import AVFoundation
import Foundation

// On iOS, a camera device's natural sensor orientation is either
// always portrait, or .videoOrientation already takes natural sensor
// orientation into account.
let DEFAULT_SENSOR_ORIENTATION = Orientation.portrait

extension AVCaptureDevice {
  /**
   Get the natural orientation of the camera sensor of this specific device.
   */
  var sensorOrientation: Orientation {
    return .portrait
  }
}
