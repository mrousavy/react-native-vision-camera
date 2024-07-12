//
//  AVCaptureDevice+sensorOrientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 04.06.24.
//

import AVFoundation
import Foundation

// On iOS, all built-in Cameras are landscape-left (90deg rotated)
let DEFAULT_SENSOR_ORIENTATION = Orientation.landscapeLeft

extension AVCaptureDevice {
  /**
   Get the natural orientation of the camera sensor of this specific device.
   */
  var sensorOrientation: Orientation {
    // TODO: There is no iOS API to get native sensor orientation.
    //       - The new `RotationCoordinator` API is a blackbox, and cannot be used statically.
    //       - Dynamically creating an AVCaptureSession is very hacky and has a runtime overhead.
    //       Hopefully iOS adds an API to get sensor orientation soon so we can use that!

    // 0. If we don't have Camera permission yet, we cannot create a temporary AVCaptureSession.
    //    So we just return the default orientation as a workaround...
    let cameraPermissionStatus = AVCaptureDevice.authorizationStatus(for: .video)
    if cameraPermissionStatus != .authorized {
      return DEFAULT_SENSOR_ORIENTATION
    }

    // 1. Create a capture session
    let session = AVCaptureSession()
    if session.canSetSessionPreset(.low) {
      session.sessionPreset = .low
    }

    // 2. Add this device as an input
    guard let input = try? AVCaptureDeviceInput(device: self) else {
      VisionLogger.log(level: .error, message: "Cannot dynamically determine \(uniqueID)'s sensorOrientation, " +
        "because the AVCaptureDeviceInput cannot be created. Falling back to \(DEFAULT_SENSOR_ORIENTATION)...")
      return DEFAULT_SENSOR_ORIENTATION
    }
    guard session.canAddInput(input) else {
      VisionLogger.log(level: .error, message: "Cannot dynamically determine \(uniqueID)'s sensorOrientation, because " +
        "it cannot be added to the temporary AVCaptureSession. Falling back to \(DEFAULT_SENSOR_ORIENTATION)...")
      return DEFAULT_SENSOR_ORIENTATION
    }
    session.addInput(input)

    // 3. Add an output (e.g. video data output)
    let output = AVCaptureVideoDataOutput()
    output.automaticallyConfiguresOutputBufferDimensions = false
    output.deliversPreviewSizedOutputBuffers = true
    guard session.canAddOutput(output) else {
      VisionLogger.log(level: .error, message: "Cannot dynamically determine \(uniqueID)'s sensorOrientation, because " +
        "the AVCaptureVideoDataOutput cannot be added to the AVCaptureSession. Falling back to \(DEFAULT_SENSOR_ORIENTATION)...")
      return DEFAULT_SENSOR_ORIENTATION
    }
    session.addOutput(output)

    // 4. Inspect the default orientation of the output
    let defaultOrientation = output.orientation

    // 5. Rotate the default orientation by the default sensor orientation we know of
    var sensorOrientation = defaultOrientation.rotatedBy(orientation: DEFAULT_SENSOR_ORIENTATION)

    // 6. If we are on the front Camera, AVCaptureVideoDataOutput.orientation is mirrored.
    if position == .front {
      sensorOrientation = sensorOrientation.flipped()
    }

    return sensorOrientation
  }
}
