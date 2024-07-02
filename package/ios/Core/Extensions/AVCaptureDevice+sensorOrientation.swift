//
//  AVCaptureDevice+sensorOrientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 04.06.24.
//

import AVFoundation
import Foundation

// On iOS, all built-in Cameras are landscape-left (90deg rotated)
private let DEFAULT_SENSOR_ORIENTATION = Orientation.landscapeLeft

extension AVCaptureDevice {
  /**
   Get the natural orientation of the camera sensor of this specific device.
   */
  var sensorOrientation: Orientation {
    guard #available(iOS 17.0, *) else {
      return DEFAULT_SENSOR_ORIENTATION
    }
    
    let rotationCoordinator = RotationCoordinator(device: self, previewLayer: nil)
    let degrees = rotationCoordinator.videoRotationAngleForHorizonLevelCapture
    return Orientation(degrees: degrees)
  }
}
