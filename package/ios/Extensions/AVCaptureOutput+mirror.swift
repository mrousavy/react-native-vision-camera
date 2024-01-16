//
//  AVCaptureOutput+mirror.swift
//  mrousavy
//
//  Created by Marc Rousavy on 18.01.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation

extension AVCaptureOutput {
  /**
   Mirrors the video output if possible.
   */
  func mirror() {
    for connection in connections {
      if connection.isVideoMirroringSupported {
        connection.automaticallyAdjustsVideoMirroring = false
        connection.isVideoMirrored = true
      }
    }
  }

  /**
   Sets the target orientation of the video output.
   This does not always physically rotate image buffers.

   - For Preview, an orientation hint is used to rotate the layer/view itself.
   - For Photos, an EXIF tag is used.
   - For Videos, the buffers are physically rotated if available, since we use an AVCaptureVideoDataOutput instead of an AVCaptureMovieFileOutput.
   */
  func setOrientation(_ orientation: Orientation) {
    // Set orientation for each connection
    for connection in connections {
      #if swift(>=5.9)
        if #available(iOS 17.0, *) {
          // Camera Sensors are always in landscape rotation (90deg).
          // We are setting the target rotation here, so we need to rotate by landscape once.
          let cameraOrientation = orientation.rotateBy(orientation: .landscapeLeft)
          let degrees = cameraOrientation.toDegrees()

          // TODO: Don't rotate the video output because it adds overhead. Instead just use EXIF flags for the .mp4 file if recording.
          //       Does that work when we flip the camera?
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
