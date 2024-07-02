//
//  AVCaptureDevice+sensorOrientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 04.06.24.
//

import AVFoundation
import Foundation

// On iOS, all built-in Cameras are landscape-left (90deg rotated)
let DEFAULT_SENSOR_ORIENTATION = Orientation.landscapeLeft

extension AVCaptureDevice {
  /**
   Get the natural orientation of the camera sensor of this specific device.
   */
  var sensorOrientation: Orientation {
    // TODO: There is no iOS API to get native sensor orientation. The new `RotationCoordinator` API is a blackbox.
    //       Hopefully iOS adds an API to get sensor orientation soon so we can use that!
    return DEFAULT_SENSOR_ORIENTATION
  }
}
