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
  /// Returns the current _interface_ orientation of the main window
  private var windowInterfaceOrientation: UIInterfaceOrientation {
    if #available(iOS 13.0, *) {
      return UIApplication.shared.windows.first?.windowScene?.interfaceOrientation ?? .unknown
    } else {
      return UIApplication.shared.statusBarOrientation
    }
  }

  /// Orientation of the input connection (preview)
  private var inputOrientation: UIInterfaceOrientation {
    return windowInterfaceOrientation
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
    // Updates the Orientation for all rotable connections (outputs) as well as for the preview layer
    DispatchQueue.main.async {
      // `windowInterfaceOrientation` and `videoPreviewLayer` should only be accessed from UI thread
      let isMirrored = self.videoDeviceInput?.device.position == .front

      self.videoPreviewLayer.connection?.setInterfaceOrientation(self.inputOrientation)

      self.cameraQueue.async {
        // Run those updates on cameraQueue since they can be blocking.
        self.captureSession.outputs.forEach { output in
          output.connections.forEach { connection in
            if connection.isVideoMirroringSupported {
              connection.automaticallyAdjustsVideoMirroring = false
              connection.isVideoMirrored = isMirrored
            }
            connection.setInterfaceOrientation(self.outputOrientation)
          }
        }
      }
    }
  }
}
