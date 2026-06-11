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

// TODO: Not every output should require conformace to `ResolutionNegotiationParticipant`, should it? e.g. metadata/output.

public protocol NativeCameraOutput: AnyObject, ResolutionNegotiationParticipant {
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
   * The ID of the `CameraSession` this output's `output` was last attached to.
   *
   * This is fully managed by `prepareForAttaching(toSessionWithID:)` - implementations
   * only need to provide the stored property (`var attachedSessionID: UInt64?`).
   */
  var attachedSessionID: UInt64? { get set }

  /**
   * Creates a new `output` instance, replacing the current one.
   *
   * An `AVCaptureOutput` can only ever be attached to a single `AVCaptureSession` in
   * its lifetime - CoreMedia attaches/detaches it to the underlying `FigCaptureSession`
   * asynchronously, so even after it has been removed from a previous `AVCaptureSession`,
   * it might still be attached (or become attached) at the CoreMedia level.
   * Re-using it in a different `AVCaptureSession` then crashes with an
   * `attachToFigCaptureSession:` assertion failure (SIGABRT).
   * See https://github.com/mrousavy/react-native-vision-camera/issues/3773
   *
   * Implementations are expected to re-apply all creation-time settings
   * (delegates, queues, format settings) to the new `output` instance.
   */
  func recreateOutput()
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

extension NativeCameraOutput {
  /**
   * Prepares this output for being attached to the `CameraSession` with the given ID.
   *
   * If this output was previously attached to a *different* `CameraSession`, the
   * underlying `AVCaptureOutput` is recreated (see `recreateOutput()`) so that we
   * never attach the same `AVCaptureOutput` instance to two `AVCaptureSession`s.
   */
  func prepareForAttaching(toSessionWithID sessionID: UInt64) {
    if let attachedSessionID = self.attachedSessionID, attachedSessionID != sessionID {
      logger.info(
        "\(type(of: self)) is moving from CameraSession #\(attachedSessionID) to CameraSession #\(sessionID) - recreating its \(Output.self)...")
      recreateOutput()
    }
    self.attachedSessionID = sessionID
  }
}
