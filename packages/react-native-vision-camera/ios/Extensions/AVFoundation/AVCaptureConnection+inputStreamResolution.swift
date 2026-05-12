//
//  AVCaptureConnection+inputStreamResolution.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 12.05.26.
//

import AVFoundation
import CoreMedia
import NitroModules

public extension AVCaptureConnection {
  /**
   * Returns the resolution of the stream currently flowing through this
   * connection's first input port, in sensor-native (un-rotated) pixels.
   *
   * Each `AVCaptureOutput` exposes a connection per media type
   * (`.video`, `.depthData`, `.metadataObject`, ...), so the caller
   * picks the right connection and asks for its input dimensions.
   *
   * Returns `nil` until the session is configured and the port has a
   * format description attached.
   */
  var inputStreamResolution: Size? {
    guard let port = inputPorts.first,
      let formatDescription = port.formatDescription
    else {
      return nil
    }
    let dims = CMVideoFormatDescriptionGetDimensions(formatDescription)
    return Size(width: Double(dims.width), height: Double(dims.height))
  }
}
