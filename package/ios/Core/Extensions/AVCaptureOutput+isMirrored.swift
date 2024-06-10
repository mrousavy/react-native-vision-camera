//
//  AVCaptureOutput+isMirrored.swift
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
  var isMirrored: Bool {
    get {
      return connections.contains { $0.isVideoMirrored == true }
    }
    set {
      for connection in connections {
        if connection.isVideoMirroringSupported {
          connection.automaticallyAdjustsVideoMirroring = false
          connection.isVideoMirrored = newValue
        }
      }
    }
  }
}
