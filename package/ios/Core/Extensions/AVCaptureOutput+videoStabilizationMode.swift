//
//  AVCaptureOutput+videoStabilizationMode.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 10.06.24.
//

import Foundation
import AVFoundation

extension AVCaptureOutput {
  /**
   Gets or sets the preferred video stabilization mode of all connections in this [AVCaptureOutput].
   */
  var videoStabilizationMode: VideoStabilizationMode {
    get {
      guard let connection = connections.first else {
        return .off
      }
      return VideoStabilizationMode(from: connection.preferredVideoStabilizationMode)
    }
    set {
      for connection in connections {
        if connection.isVideoStabilizationSupported {
          connection.preferredVideoStabilizationMode = newValue.toAVCaptureVideoStabilizationMode()
        }
      }
    }
  }
}
