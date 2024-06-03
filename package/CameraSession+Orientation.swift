//
//  CameraSession+Orientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import Foundation
import AVFoundation

extension CameraSession: CameraOrientationCoordinatorDelegate {
  /**
   Updates the connected PreviewView's output orientation angle
   */
  func onPreviewRotationChanged(rotationAngle: Double) {
    guard #available(iOS 13.0, *) else {
      // Orientation is only available on iOS 13+.
      return
    }
    
    VisionLogger.log(level: .info, message: "Updating Preview rotation: \(rotationAngle)°...")
    
    // update the orientation for each preview layer that is connected to this capture session
    let previewConnections = captureSession.connections.filter { $0.videoPreviewLayer != nil }
    for connection in previewConnections {
      connection.setOrientation(degrees: rotationAngle)
    }
  }
  
  func onOutputRotationChanged(rotationAngle: Double) {
    VisionLogger.log(level: .info, message: "Updating Outputs rotation: \(rotationAngle)°...")
    
    // update the orientation for each output that supports virtual (no-performance-overhead) rotation
    let rotateableOutputs = captureSession.outputs.filter { $0.supportsVirtualRotation }
    for output in rotateableOutputs {
      // set orientation for all connections
      for connection in output.connections {
        connection.setOrientation(degrees: rotationAngle)
      }
    }
  }
}
