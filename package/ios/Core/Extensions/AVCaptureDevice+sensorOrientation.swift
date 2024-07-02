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
    if #available(iOS 17.0, *), deviceType == .external {
      // For external Cameras, we try to get the sensorOrientation using RotationCoordinator
      let rotationCoordinator = RotationCoordinator(device: self, previewLayer: nil)
      let degrees = rotationCoordinator.videoRotationAngleForHorizonLevelCapture
      return Orientation(degrees: degrees)
    }
    
    // TODO: Wait for iOS to add an actual API to get native sensor orientation
    
    // For built-in Cameras, we just return the default hardcoded orientation
    return .landscapeLeft
  }
}
