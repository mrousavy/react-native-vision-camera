//
//  AVCaptureDevice+isMirrored.swift
//  VisionCamera
//
//  Created by Maxime Blanchard on 17/11/2023.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation

extension AVCaptureDevice {
  /**
   Returns true if the device is a front camera.
   */
  var isMirrored: Bool {
    self.position == .front
  }
}
