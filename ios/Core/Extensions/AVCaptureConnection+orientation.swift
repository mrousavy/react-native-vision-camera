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
      // TODO: Use new videoRotationAngle APIs?
      return Orientation(videoOrientation: videoOrientation)
    }
    set {
      // TODO: Use new videoRotationAngle APIs?
      if isVideoOrientationSupported {
        videoOrientation = newValue.videoOrientation
      }
    }
  }
}
