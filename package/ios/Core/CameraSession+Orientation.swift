//
//  CameraSession+Orientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import AVFoundation
import Foundation

extension CameraSession: OrientationManagerDelegate {
  /**
   Get the orientation of the currently connected camera device's sensor.
   */
  private var sensorOrientation: Orientation {
    guard let input = videoDeviceInput else {
      return DEFAULT_SENSOR_ORIENTATION
    }
    return input.device.sensorOrientation
  }

  /**
   Get the orientation all outputs should be configured to so they appear up-right.
   This is usually just a counter-rotation to whatever the input camera stream is.
   */
  var outputOrientation: Orientation {
    return orientationManager.outputOrientation
  }

  func onPreviewOrientationChanged(previewOrientation: Orientation) {
    configurePreviewOrientation(previewOrientation)
    delegate?.onPreviewOrientationChanged(previewOrientation)
  }

  func onOutputOrientationChanged(outputOrientation: Orientation) {
    configureOutputOrientation(outputOrientation)
    delegate?.onOutputOrientationChanged(outputOrientation)
  }

  /**
   Updates the connected PreviewView's output orientation angle
   */
  func configurePreviewOrientation(_ previewOrientation: Orientation) {
    guard #available(iOS 13.0, *) else {
      // .connections is only available on iOS 13+.
      return
    }

    VisionLogger.log(level: .info, message: "Updating Preview rotation: \(previewOrientation)...")

    // update the orientation for each preview layer that is connected to this capture session
    let previewConnections = captureSession.connections.filter { $0.videoPreviewLayer != nil }
    for connection in previewConnections {
      if connection.isVideoMirrored && sensorOrientation.isLandscape {
        // If this connection uses video mirroring, it flips frames alongside the vertical axis.
        // If the orientation is portrait, we flip it upside down to mirror alongside horizontal axis.
        VisionLogger.log(level: .info, message: "Flipping Preview orientation \(previewOrientation) to mirror it...")
        connection.orientation = previewOrientation.flipped()
      } else {
        connection.orientation = previewOrientation
      }
    }

    // Code Scanner coordinates are relative to Preview Orientation
    if let codeScannerOutput {
      codeScannerOutput.orientation = previewOrientation
    }
  }

  /**
   Updates the orientation angle of all connected virtually-rotateable outputs.
   */
  func configureOutputOrientation(_ outputOrientation: Orientation) {
    VisionLogger.log(level: .info, message: "Updating Outputs rotation: \(outputOrientation)...")

    // update the orientation for each output that supports virtual (no-performance-overhead) rotation.
    // the video output (physical pixel rotation) is always rotated to the sensor orientation.
    let rotateableOutputs = captureSession.outputs.filter(\.supportsVirtualRotation)
    for output in rotateableOutputs {
      // set orientation for all connections
      for connection in output.connections {
        if connection.isVideoMirrored && sensorOrientation.isLandscape {
          // If this connection uses video mirroring, it flips frames alongside the vertical axis.
          // If the orientation is portrait, we flip it upside down to mirror alongside horizontal axis.
          VisionLogger.log(level: .info, message: "Flipping Output orientation \(outputOrientation) to mirror it...")
          connection.orientation = outputOrientation.flipped()
        } else {
          connection.orientation = outputOrientation
        }
      }
    }
  }
}
