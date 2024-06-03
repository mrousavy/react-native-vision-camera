//
//  AVCaptureConnection+setOrientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import AVFoundation
import Foundation

extension AVCaptureConnection {
  /**
   Sets the target orientation of the video output.
   */
  func setOrientation(degrees: Double) {
    if #available(iOS 17.0, *) {
      if isVideoRotationAngleSupported(degrees) {
        videoRotationAngle = degrees
      }
    } else {
      if isVideoOrientationSupported {
        let orientation = Orientation(degrees: degrees)
        videoOrientation = orientation.videoOrientation
      }
    }
  }
}
