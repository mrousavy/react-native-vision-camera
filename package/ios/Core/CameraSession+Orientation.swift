//
//  CameraSession+Orientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import AVFoundation
import Foundation

extension CameraSession: OrientationManagerDelegate {
  var outputOrientation: Orientation {
    return orientationManager.outputOrientation
  }
  
  var isMirrored: Bool {
    guard let videoDeviceInput else {
      return false
    }
    return videoDeviceInput.device.position == .front
  }

  /**
   Updates the connected PreviewView's output orientation angle
   */
  func onPreviewOrientationChanged(previewOrientation: Orientation) {
    guard #available(iOS 13.0, *) else {
      // Orientation is only available on iOS 13+.
      return
    }

    VisionLogger.log(level: .info, message: "Updating Preview rotation: \(previewOrientation)...")

    // update the orientation for each preview layer that is connected to this capture session
    let previewConnections = captureSession.connections.filter { $0.videoPreviewLayer != nil }
    for connection in previewConnections {
      connection.orientation = previewOrientation
    }
  }

  func onOutputOrientationChanged(outputOrientation: Orientation) {
    VisionLogger.log(level: .info, message: "Updating Outputs rotation: \(outputOrientation)...")

    // update the orientation for each output that supports virtual (no-performance-overhead) rotation
    let rotateableOutputs = captureSession.outputs.filter(\.supportsVirtualRotation)
    for output in rotateableOutputs {
      // set orientation for all connections
      for connection in output.connections {
        connection.orientation = outputOrientation
      }
    }
  }
}
