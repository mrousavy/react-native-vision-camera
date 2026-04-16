//
//  VideoDelegate.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.11.25.
//

import AVFoundation
import Foundation

final class VideoDelegate: NSObject, AVCaptureFileOutputRecordingDelegate {
  // Statically cache delegates because the AVCaptureOutput only captures them weakly
  private static var delegates: [VideoDelegate] = []

  var onRecordingStarted: (() -> Void)?
  var onRecordingPaused: (() -> Void)?
  var onRecordingResumed: (() -> Void)?
  var onRecordingFinished: (URL) -> Void
  var onRecordingError: (any Error) -> Void

  init(
    onRecordingStarted: (() -> Void)? = nil,
    onRecordingPaused: (() -> Void)? = nil,
    onRecordingResumed: (() -> Void)? = nil,
    onRecordingFinished: @escaping (URL) -> Void,
    onRecordingError: @escaping (any Error) -> Void
  ) {
    self.onRecordingStarted = onRecordingStarted
    self.onRecordingPaused = onRecordingPaused
    self.onRecordingResumed = onRecordingResumed
    self.onRecordingFinished = onRecordingFinished
    self.onRecordingError = onRecordingError
    super.init()
    // Add a static strong reference while capture is in progress
    VideoDelegate.delegates.append(self)
  }

  func fileOutput(
    _ output: AVCaptureFileOutput, didStartRecordingTo fileURL: URL, startPTS: CMTime,
    from connections: [AVCaptureConnection]
  ) {
    logger.info("Recording started with timestamp: \(startPTS.seconds)")
    onRecordingStarted?()
  }
  func fileOutput(
    _ output: AVCaptureFileOutput, didStartRecordingTo fileURL: URL,
    from connections: [AVCaptureConnection]
  ) {
    logger.info("Recording started without timestamp.")
    onRecordingStarted?()
  }
  func fileOutput(
    _ output: AVCaptureFileOutput, didPauseRecordingTo fileURL: URL,
    from connections: [AVCaptureConnection]
  ) {
    onRecordingPaused?()
  }
  func fileOutput(
    _ output: AVCaptureFileOutput, didResumeRecordingTo fileURL: URL,
    from connections: [AVCaptureConnection]
  ) {
    onRecordingResumed?()
  }

  func fileOutput(
    _ output: AVCaptureFileOutput, didFinishRecordingTo outputFileURL: URL,
    from connections: [AVCaptureConnection], error: (any Error)?
  ) {
    if let error {
      onRecordingError(error)
    } else {
      onRecordingFinished(outputFileURL)
    }
    // Remove the static strong reference, we're done
    VideoDelegate.delegates.removeAll { $0 == self }
  }
}
