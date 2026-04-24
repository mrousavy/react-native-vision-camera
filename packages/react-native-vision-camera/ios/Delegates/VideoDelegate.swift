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
  var onRecordingFinished: (URL, RecordingFinishedReason) -> Void
  var onRecordingError: (any Error) -> Void

  init(
    onRecordingStarted: (() -> Void)? = nil,
    onRecordingPaused: (() -> Void)? = nil,
    onRecordingResumed: (() -> Void)? = nil,
    onRecordingFinished: @escaping (URL, RecordingFinishedReason) -> Void,
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
      // We have an error! Either we hit our max limits, or it's a true unexpected error.
      let nsError = error as NSError
      switch nsError.code {
      case AVError.maximumDurationReached.rawValue:
        // We hit max duration limit - treat this as a success, not error!
        onRecordingFinished(outputFileURL, .maxDurationReached)
      case AVError.maximumFileSizeReached.rawValue:
        // We hit max file size limit - treat this as a success, not error!
        onRecordingFinished(outputFileURL, .maxFileSizeReached)
      default:
        // We hit any other kind of error - this is an error event now.
        onRecordingError(error)
      }
    } else {
      // No error, everything went according to plan we just stopped + finished:
      onRecordingFinished(outputFileURL, .stopped)
    }

    // Remove the static strong reference, we're done
    VideoDelegate.delegates.removeAll { $0 == self }
  }
}
