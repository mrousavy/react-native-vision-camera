//
//  CameraView+Orientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 04.01.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

import Foundation
import UIKit

extension CameraView {
  /// Orientation of the input connection (preview)
  private var inputOrientation: UIInterfaceOrientation {
    return .portrait
  }

  // Orientation of the output connections (photo, video, frame processor)
  private var outputOrientation: UIInterfaceOrientation {
    if let userOrientation = orientation as String?,
       let parsedOrientation = try? UIInterfaceOrientation(withString: userOrientation) {
      // user is overriding output orientation
      return parsedOrientation
    } else {
      // use same as input orientation
      return inputOrientation
    }
  }

  internal func updateOrientation() {
    // Updates the Orientation for all rotable
    let isMirrored = self.videoDeviceInput?.device.position == .front

    let connectionOrientation = self.outputOrientation
    self.captureSession.outputs.forEach { output in
      output.connections.forEach { connection in
        if connection.isVideoMirroringSupported {
          connection.automaticallyAdjustsVideoMirroring = false
          connection.isVideoMirrored = isMirrored
        }
        connection.setInterfaceOrientation(connectionOrientation)
      }
    }
  }
}
