///
/// NativeCameraOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation

// TODO: Try to figure out if we can get the Preview Output conform to the `NativeCameraOutput` protocol too somehow.
//       We have a lot of conditional code that checks `NativeCameraOutput` first, `NativePreviewViewOutput` second.
//       It's possible that I have missed some of those cases because it's only visible at runtime, so let's try to
//       avoid that and get the Preview into here too - maybe the `Output` class could be PreviewLayer then somehow? Idk.

// TODO: Refactor this to expose "requiredMediaTypes" ([.video, .audio, .depth]),
//       so that the +addConnection/+addAudioInput code connects all required outputs.
//       E.g. a AVCapturePhotoOutput might use [.video] or [.video, .depth] (portrait)
//       E.g. a AVCaptureMovieFileOutput might use [.video], [.video, .audio] or [.video, .audio, .depth] (cinematic)
//       Then we can remove `requiresAudioInput` and remove the special handling for adding/removing a
//       microphone connection in our HybridCameraSession. We just add all connections necessary.

// TODO: Not every output should require conformace to `ResolutionNegotionParticipant`, should it? e.g. metadata/output.

public protocol NativeCameraOutput: AnyObject, ResolutionNegotionParticipant {
  associatedtype Output: AVCaptureOutput

  /**
   * Represents the actual `AVCaptureOutput`
   * that should be added to the `AVCaptureSession`.
   *
   * It will be manually connected to whatever input
   * it is connected to in `CameraSession.configure(..)`.
   */
  var output: Output { get }
  /**
   * Whether this `NativeCameraOutput` requires
   * an audio input attached to its `AVCaptureOutput`.
   *
   * If true, both the camera input and an audio input will
   * be connected to the `AVCaptureOutput`.
   */
  var requiresAudioInput: Bool { get }

  /**
   * Whether this `NativeCameraOutput` requires
   * a depth-`AVCaptureDevice.Format` to be enabled
   * via `AVCaptureDevice.activeDepthFormat`.
   */
  var requiresDepthFormat: Bool { get }

  /**
   * Called whenever the `CameraOutputConfiguration` might
   * change, in a `beginConfiguration()`/`commitConfiguration()`
   * batch.
   * The `NativeCameraOutput` is expected to apply all configs
   * such as orientation or mirroring settings in here.
   */
  func configure(config: CameraOutputConfiguration)
}
