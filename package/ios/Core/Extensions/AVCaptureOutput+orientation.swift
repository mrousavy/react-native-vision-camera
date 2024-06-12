//
//  AVCaptureOutput+orientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 04.06.24.
//

import AVFoundation
import Foundation

extension AVCaptureOutput {
  func getOrientation(device: AVCaptureDevice) -> Orientation {
    guard let connection = connections.first else {
      return .portrait
    }
    return connection.getOrientation(device: device)
  }

  func setOrientation(newOrientation: Orientation, device: AVCaptureDevice) {
    for connection in connections {
      connection.setOrientation(newOrientation: newOrientation, device: device)
    }
  }
}
