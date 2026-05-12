///
/// AVCaptureConnection+currentResolution.swift
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

import AVFoundation
import CoreMedia
import Foundation
import NitroModules

extension AVCaptureConnection {
  /**
   * Returns the resolution of the video stream currently flowing through
   * this connection in sensor-native (un-rotated) pixels, or `nil` if no
   * input port has a format description yet (i.e. the session isn't
   * configured or hasn't started running).
   */
  var currentResolution: Size? {
    guard let port = inputPorts.first,
      let formatDescription = port.formatDescription
    else {
      return nil
    }
    let dims = CMVideoFormatDescriptionGetDimensions(formatDescription)
    return Size(width: Double(dims.width), height: Double(dims.height))
  }
}
