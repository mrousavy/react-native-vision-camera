///
/// HybridVideoRecorder.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

class HybridVideoRecorder: HybridRecorderSpec {
  private let videoOutput: AVCaptureMovieFileOutput
  private let queue: DispatchQueue
  private let fileURL: URL
  private let maxRecordedDuration: CMTime
  private let maxRecordedFileSize: Int64
  private var isCancelled = false

  init(
    videoOutput: AVCaptureMovieFileOutput,
    queue: DispatchQueue,
    fileType: RecorderFileType,
    settings: RecorderSettings
  ) throws {
    self.videoOutput = videoOutput
    self.queue = queue
    self.fileURL = try URL.createTempURL(fileType: fileType.toUTType())
    // `CMTime.invalid` / `0` mean "no limit" for `AVCaptureMovieFileOutput`.
    self.maxRecordedDuration =
      settings.maxDuration.map { CMTime(seconds: $0, preferredTimescale: 600) } ?? .invalid
    self.maxRecordedFileSize = settings.maxFileSize.map { Int64($0) } ?? 0
    super.init()
  }

  var isRecording: Bool {
    return videoOutput.isRecording
  }
  var isPaused: Bool {
    guard #available(iOS 18.0, *) else {
      return false
    }
    return videoOutput.isRecordingPaused
  }
  var recordedDuration: Double {
    return videoOutput.recordedDuration.seconds
  }
  var recordedFileSize: Double {
    return Double(videoOutput.recordedFileSize)
  }
  var filePath: String {
    return fileURL.absoluteString
  }

  func startRecording(
    onRecordingFinished: @escaping (_ filePath: String) -> Void,
    onRecordingError: @escaping (_ error: Error) -> Void,
    onRecordingPaused: (() -> Void)?,
    onRecordingResumed: (() -> Void)?
  ) throws -> Promise<Void> {
    let promise = Promise<Void>()
    var isResolved = false

    queue.async {
      // On our serial queue, make sure we are connected to the Camera
      guard self.videoOutput.connection(with: .video) != nil else {
        let error = RuntimeError.error(
          withMessage: "VideoOutput is not yet connected to the CameraSession!")
        promise.reject(withError: error)
        return
      }
      // On our serial queue, make sure we are currently not recoring
      guard !self.videoOutput.isRecording else {
        let error = RuntimeError.error(withMessage: "Active recording already in progress!")
        promise.reject(withError: error)
        return
      }

      // Prepare the delegate to resolve the Promise and notify listeners
      let delegate = VideoDelegate(
        onRecordingStarted: {
          // Recording started!
          promise.resolve()
          isResolved = true
        },
        onRecordingPaused: onRecordingPaused,
        onRecordingResumed: onRecordingResumed,
        onRecordingFinished: { url in
          if self.isCancelled {
            // Recording was cancelled - delete the file
            try? FileManager.default.removeItem(at: url)
            return
          }
          // Recording finished!
          onRecordingFinished(url.absoluteString)
        },
        onRecordingError: { error in
          if !isResolved {
            // We failed to even start the video recording!
            promise.reject(withError: error)
            isResolved = true
          } else {
            // An error occurred later on
            onRecordingError(error)
          }
        })

      // Apply recording limits. `AVCaptureMovieFileOutput` delivers the file
      // via the success path when either limit is reached (see `VideoDelegate`).
      self.videoOutput.maxRecordedDuration = self.maxRecordedDuration
      self.videoOutput.maxRecordedFileSize = self.maxRecordedFileSize

      // Start recording!
      self.videoOutput.startRecording(to: self.fileURL, recordingDelegate: delegate)
    }
    return promise
  }

  func stopRecording() throws -> Promise<Void> {
    return Promise.parallel(queue) {
      self.videoOutput.stopRecording()
    }
  }

  func pauseRecording() throws -> Promise<Void> {
    return Promise.parallel(queue) {
      guard #available(iOS 18.0, *) else {
        throw RuntimeError.error(
          withMessage: "`pauseRecording()` is only available on iOS 18 or above!")
      }
      self.videoOutput.pauseRecording()
    }
  }

  func resumeRecording() throws -> Promise<Void> {
    return Promise.parallel(queue) {
      guard #available(iOS 18.0, *) else {
        throw RuntimeError.error(
          withMessage: "`resumeRecording()` is only available on iOS 18 or above!")
      }
      self.videoOutput.resumeRecording()
    }
  }

  func cancelRecording() throws -> Promise<Void> {
    return Promise.parallel(queue) {
      guard self.videoOutput.isRecording else {
        throw RuntimeError.error(withMessage: "Not currently recording!")
      }
      // Mark as cancelled so the onRecordingFinished callback
      // deletes the file instead of notifying the caller
      self.isCancelled = true
      self.videoOutput.stopRecording()
    }
  }
}
