///
/// NativeCameraOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

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
   * The `AVCaptureSession` this output's `output` was last attached to.
   *
   * This is fully managed by `prepareForAttaching(to:)` - implementations only
   * need to provide the stored property (`weak var attachedSession: AVCaptureSession?`).
   * It is deliberately `weak`: once the previous session deallocates, its `deinit`
   * has synchronously detached this output at the CoreMedia level, so a `nil`
   * value proves the output is safe to attach to a new session.
   */
  var attachedSession: AVCaptureSession? { get set }
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
  func configure(config: OutputConfiguration)
}

extension NativeCameraOutput {
  /**
   * Ensures this output's `output` can safely be attached to the given [session].
   *
   * An `AVCaptureOutput` is attached to/detached from the underlying `FigCaptureSession`
   * asynchronously (via CoreMedia commit notifications), so after being removed from a
   * previous `AVCaptureSession` it may still be attached at the CoreMedia level - adding
   * it to a second `AVCaptureSession` in that state crashes with an
   * `attachToFigCaptureSession:` assertion failure (SIGABRT).
   * See https://github.com/mrousavy/react-native-vision-camera/issues/3773
   *
   * The only point where the detach is *guaranteed* to have happened is the previous
   * session's `deinit`, which detaches synchronously. So re-attaching to the same
   * session is always allowed, and attaching to a new session is only allowed once the
   * previous session has been deallocated (`attachedSession` is `weak` and reads `nil`).
   */
  func prepareForAttaching(to session: AVCaptureSession) throws {
    if let previousSession = attachedSession, previousSession !== session {
      throw RuntimeError.error(
        withMessage:
          "\(type(of: self)) is still attached to a different CameraSession! "
          + "An output can only be re-used in a new CameraSession after the previous CameraSession "
          + "has been released - call `dispose()` on the previous CameraSession first.")
    }
    self.attachedSession = session
  }
}
