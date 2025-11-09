///
/// NativePreviewViewOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import AVFoundation

public protocol NativePreviewViewOutput {
  var previewLayer: AVCaptureVideoPreviewLayer { get }
}
