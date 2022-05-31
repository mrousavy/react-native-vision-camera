//
//  SilentPhotoCaptureDelegate.swift
//  mrousavy
//
//  Created by Marc Rousavy on 31.05.22.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import AVFoundation

// MARK: - SilentPhotoCaptureDelegate

class SilentPhotoCaptureDelegate: PhotoCaptureDelegate {

  required init(promise: Promise) {
    super.init(promise: promise)
  }

  func photoOutput(_ output: AVCapturePhotoOutput, willCapturePhotoFor resolvedSettings: AVCaptureResolvedPhotoSettings) {
    // dispose system shutter sound
    AudioServicesDisposeSystemSoundID(1108)
  }
}
