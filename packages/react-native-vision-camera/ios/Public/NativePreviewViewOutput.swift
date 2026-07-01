///
/// NativePreviewViewOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation

public protocol NativePreviewViewOutput: AnyObject, ResolutionNegotiationParticipant {
  var previewLayer: AVCaptureVideoPreviewLayer { get }

  /**
   * Called whenever the `OutputConfiguration` might
   * change, in a `beginConfiguration()`/`commitConfiguration()`
   * batch.
   * The `NativePreviewViewOutput` is expected to apply all configs
   * such as orientation or mirroring settings in here.
   */
  func configure(config: OutputConfiguration)
}
