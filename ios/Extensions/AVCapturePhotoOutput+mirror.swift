//
//  AVCapturePhotoOutput+mirror.swift
//  Cuvent
//
//  Created by Marc Rousavy on 18.01.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import AVFoundation

extension AVCapturePhotoOutput {
  func mirror() {
    connections.forEach { connection in
      if connection.isVideoMirroringSupported {
        connection.isVideoMirrored = true
      }
    }
  }
}
