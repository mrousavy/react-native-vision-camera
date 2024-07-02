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
      guard let connection = connections.first else {
        fatalError("AVCaptureOutput needs to be connected before accessing .connection!")
      }
      return connection.orientation
    }
    set {
      for connection in connections {
        connection.orientation = newValue
      }
    }
  }
}
