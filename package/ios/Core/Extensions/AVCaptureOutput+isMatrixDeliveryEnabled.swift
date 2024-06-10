//
//  AVCaptureOutput+isMatrixDeliveryEnabled.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 10.06.24.
//

import Foundation
import AVFoundation

extension AVCaptureOutput {
  /**
   Gets or sets whether camera-intrinstic matrix delivery is enabled for this video output.
   */
  var isMatrixDeliveryEnabled: Bool {
    get {
      guard let connection = connections.first else {
        return false
      }
      return connection.isCameraIntrinsicMatrixDeliveryEnabled
    }
    set {
      for connection in connections {
        if connection.isCameraIntrinsicMatrixDeliverySupported {
          connection.isCameraIntrinsicMatrixDeliveryEnabled = newValue
        }
      }
    }
  }
}
