//
//  AVCaptureVideoDataOutput+mirror.swift
//  Cuvent
//
//  Created by Marc Rousavy on 18.01.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation

extension AVCaptureVideoDataOutput {
  func mirror() {
    connections.forEach { connection in
      if connection.isVideoMirroringSupported {
        connection.isVideoMirrored = true
      }
    }
  }

  var isMirrored: Bool {
    return connections.contains { connection in
      connection.isVideoMirrored
    }
  }
}
