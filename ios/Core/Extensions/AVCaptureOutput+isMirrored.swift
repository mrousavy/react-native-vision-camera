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
      guard let connection = connection(with: .video) else {
        fatalError("AVCaptureOutput needs to be connected before accessing .isMirrored!")
      }
      return connection.isVideoMirrored
    }
    set {
      assert(!connections.isEmpty, "isMirrored can only be set when connected to a session!")
      for connection in connections {
        if connection.isVideoMirroringSupported {
          connection.automaticallyAdjustsVideoMirroring = false
          connection.isVideoMirrored = newValue
        }
      }
    }
  }
}
