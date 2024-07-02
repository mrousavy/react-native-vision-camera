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
   Get the orientation all outputs should be configured to so they appear up-right.
   This is usually just a counter-rotation to whatever the input camera stream is.
   */
  var outputOrientation: Orientation {
    return orientationManager.outputOrientation
  }

  /**
   Gets the output orientation of the video file that will be recorded into.
   The resulting output orientation is flipped by 180° if the input stream is mirrored and 90° or 270° rotated to mimic a mirroring effect.
   This assumes that mirroring and 180° counter-rotation is also configured on the input stream, see CameraSession+Configuration.
   */
  var videoFileOrientation: Orientation {
    var orientation = outputOrientation
    if let videoOutput {
      if videoOutput.isMirrored && !orientation.isLandscape {
        orientation = orientation.flipped()
      }
    }
    return orientation
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
      // .videoPreviewLayer is only available on iOS 13+.
      return
    }

    VisionLogger.log(level: .info, message: "Updating Preview rotation: \(previewOrientation)...")

    // update the orientation for each preview layer that is connected to this capture session
    let previewConnections = captureSession.connections.filter { $0.videoPreviewLayer != nil }
    for connection in previewConnections {
      connection.orientation = previewOrientation
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
        connection.orientation = outputOrientation
      }
    }
  }
}
