///
/// NativeCameraOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import AVFoundation

public protocol NativeCameraOutput {
  var output: AVCaptureOutput { get }
}
