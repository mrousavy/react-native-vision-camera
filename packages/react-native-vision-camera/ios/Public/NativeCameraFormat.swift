//
//  NativeCameraFormat.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.12.25.
//

import AVFoundation

public protocol NativeCameraFormat: AnyObject {
  var format: AVCaptureDevice.Format { get }
}
