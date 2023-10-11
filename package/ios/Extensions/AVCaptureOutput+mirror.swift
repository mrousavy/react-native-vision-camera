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
    connections.forEach { connection in
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
  func setOrientation(_ orientation: AVCaptureVideoOrientation) {
    connections.forEach { connection in
      if connection.isVideoOrientationSupported {
        connection.videoOrientation = orientation
      }
    }
  }
}
