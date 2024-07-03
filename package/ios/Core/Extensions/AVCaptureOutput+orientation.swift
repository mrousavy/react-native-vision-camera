//
//  AVCaptureOutput+orientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 04.06.24.
//

import AVFoundation
import Foundation

extension AVCaptureOutput {
  /**
   Gets or sets the target orientation of the video output.
   */
  var orientation: Orientation {
    get {
      guard let connection = connection(with: .video) else {
        fatalError("AVCaptureOutput needs to be connected before accessing .connection!")
      }
      return connection.orientation
    }
    set {
      assert(!connections.isEmpty, "isMirrored can only be set when connected to a session!")
      for connection in connections {
        connection.orientation = newValue
      }
    }
  }
}
