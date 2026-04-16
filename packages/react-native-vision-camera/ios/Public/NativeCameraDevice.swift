//
//  NativeCameraDevice.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.12.25.
//

import AVFoundation

public protocol NativeCameraDevice: AnyObject {
  var device: AVCaptureDevice { get }
}
