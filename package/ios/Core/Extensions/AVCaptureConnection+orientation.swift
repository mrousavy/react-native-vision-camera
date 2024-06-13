//
//  AVCaptureConnection+orientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import AVFoundation
import Foundation

extension AVCaptureConnection {
  /**
   Gets or sets the target orientation of the video connection.
   */
  var orientation: Orientation {
    get {
      if #available(iOS 17.0, *) {
        return Orientation(degrees: videoRotationAngle)
      } else {
        return Orientation(videoOrientation: videoOrientation).rotatedBy(orientation: DEFAULT_SENSOR_ORIENTATION)
      }
    }
    set {
      if #available(iOS 17.0, *) {
        let degrees = newValue.degrees
        if isVideoRotationAngleSupported(degrees) {
          videoRotationAngle = degrees
        }
      } else {
        if isVideoOrientationSupported {
          videoOrientation = newValue.rotatedBy(degrees: -DEFAULT_SENSOR_ORIENTATION.degrees).videoOrientation
        }
      }
    }
  }
}
