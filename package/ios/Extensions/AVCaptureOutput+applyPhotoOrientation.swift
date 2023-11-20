//
//  AVCaptureOutput+applyPhotoOrientation.swift
//  VisionCamera
//
//  Created by Maxime Blanchard on 17/11/2023.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation

extension AVCaptureOutput {
  /**
   Sets the target orientation of the video output.
   */
  func applyPhotoOrientation(_ orientation: Orientation, isMirrored: Bool) {
    // Set orientation for each connection
    connections.forEach { connection in
      #if swift(>=5.9)
        if #available(iOS 17.0, *) {
          // Camera Sensors are always in landscape rotation (90deg).
          // We are setting the target rotation here, so we need to rotate by landscape once.
          let cameraOrientation = orientation.rotateBy(orientation: .landscapeLeft)
          var degrees = cameraOrientation.toDegrees()
          
          // When Camera is mirrored, we need to rotate the output image 180 degrees
          let isLandscape = orientation == .landscapeLeft || orientation == .landscapeRight
          if isMirrored && isLandscape {
            degrees = (degrees + 180).truncatingRemainder(dividingBy: 360)
          }
          
          if connection.isVideoRotationAngleSupported(degrees) {
            connection.videoRotationAngle = degrees
          }
        } else {
          if connection.isVideoOrientationSupported {
            connection.videoOrientation = orientation.toAVCaptureVideoOrientation()
          }
        }
      #else
        if connection.isVideoOrientationSupported {
          connection.videoOrientation = orientation.toAVCaptureVideoOrientation()
        }
      #endif
    }
  }
}
