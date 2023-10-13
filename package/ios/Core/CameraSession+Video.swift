//
//  CameraSession+Video.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation
import UIKit

extension CameraSession {
  /**
   Starts a video + audio recording with a custom Asset Writer.
   */
  func startRecording(options: RecordVideoOptions,
                      onVideoRecorded: @escaping (_ video: Video) -> Void,
                      onError: @escaping (_ error: CameraError) -> Void) {
    // Run on Camera Queue
    CameraQueues.cameraQueue.async {
      ReactLogger.log(level: .info, message: "Starting Video recording...")

      if options.flash != .off {
        // use the torch as the video's flash
        self.configure { config in
          config.torch = options.flash
        }
      }

      // Get Video Output
      guard let videoOutput = self.videoOutput else {
        if self.configuration?.video == .disabled {
          onError(.capture(.videoNotEnabled))
        } else {
          onError(.session(.cameraNotReady))
        }
        return
      }

      let enableAudio = self.configuration?.audio != .disabled

      // Callback for when the recording ends
      let onFinish = { (recordingSession: RecordingSession, status: AVAssetWriter.Status, error: Error?) in
        defer {
          // Disable Audio Session again
          if enableAudio {
            CameraQueues.audioQueue.async {
              self.deactivateAudioSession()
            }
          }
          // Reset flash
          if options.flash != .off {
            // Set torch mode back to what it was before if we used it for the video flash.
            self.configure { config in
              let torch = self.configuration?.torch ?? .off
              config.torch = torch
            }
          }
        }

        self.recordingSession = nil
        self.isRecording = false
        ReactLogger.log(level: .info, message: "RecordingSession finished with status \(status.descriptor).")

        if let error = error as NSError? {
          ReactLogger.log(level: .error, message: "RecordingSession Error \(error.code): \(error.description)")
          // Something went wrong, we have an error
          if error.domain == "capture/aborted" {
            onError(.capture(.aborted))
          } else {
            onError(.capture(.unknown(message: "An unknown recording error occured! \(error.code) \(error.description)")))
          }
        } else {
          if status == .completed {
            // Recording was successfully saved
            let video = Video(path: recordingSession.url.absoluteString,
                              duration: recordingSession.duration)
            onVideoRecorded(video)
          } else {
            // Recording wasn't saved and we don't have an error either.
            onError(.unknown(message: "AVAssetWriter completed with status: \(status.descriptor)"))
          }
        }
      }

      // Create temporary file
      let errorPointer = ErrorPointer(nilLiteral: ())
      let fileExtension = options.fileType.descriptor ?? "mov"
      guard let tempFilePath = RCTTempFilePath(fileExtension, errorPointer) else {
        let message = errorPointer?.pointee?.description
        onError(.capture(.createTempFileError(message: message)))
        return
      }

      ReactLogger.log(level: .info, message: "File path: \(tempFilePath)")
      let tempURL = URL(string: "file://\(tempFilePath)")!

      let recordingSession: RecordingSession
      do {
        recordingSession = try RecordingSession(url: tempURL,
                                                fileType: options.fileType,
                                                completion: onFinish)
      } catch let error as NSError {
        onError(.capture(.createRecorderError(message: error.description)))
        return
      }
      self.recordingSession = recordingSession

      // Init Video
      guard var videoSettings = self.recommendedVideoSettings(videoOutput: videoOutput,
                                                              fileType: options.fileType,
                                                              videoCodec: options.codec),
        !videoSettings.isEmpty else {
        onError(.capture(.createRecorderError(message: "Failed to get video settings!")))
        return
      }
      ReactLogger.log(level: .trace, message: "Recommended Video Settings: \(videoSettings.description)")

      // Custom Video Bit Rate
      if let videoBitRate = options.bitRate {
        // Convert from Mbps -> bps
        let bitsPerSecond = videoBitRate * 1_000_000
        videoSettings[AVVideoCompressionPropertiesKey] = [
          AVVideoAverageBitRateKey: NSNumber(value: bitsPerSecond),
        ]
      }

      // get pixel format (420f, 420v, x420)
      let pixelFormat = videoOutput.pixelFormat
      recordingSession.initializeVideoWriter(withSettings: videoSettings,
                                             pixelFormat: pixelFormat)

      // Enable/Activate Audio Session (optional)
      if enableAudio {
        if let audioOutput = self.audioOutput {
          // Activate Audio Session asynchronously
          CameraQueues.audioQueue.async {
            do {
              try self.activateAudioSession()
            } catch {
              self.onConfigureError(error)
            }
          }

          // Initialize audio asset writer
          let audioSettings = audioOutput.recommendedAudioSettingsForAssetWriter(writingTo: options.fileType)
          recordingSession.initializeAudioWriter(withSettings: audioSettings)
        }
      }

      // start recording session with or without audio.
      do {
        try recordingSession.startAssetWriter()
        self.isRecording = true
      } catch let error as NSError {
        onError(.capture(.createRecorderError(message: "RecordingSession failed to start asset writer. \(error.description)")))
        return
      }
    }
  }

  /**
   Stops an active recording.
   */
  func stopRecording(promise: Promise) {
    CameraQueues.cameraQueue.async {
      self.isRecording = false

      withPromise(promise) {
        guard let recordingSession = self.recordingSession else {
          throw CameraError.capture(.noRecordingInProgress)
        }
        recordingSession.finish()
        return nil
      }
    }
  }

  /**
   Pauses an active recording.
   */
  func pauseRecording(promise: Promise) {
    CameraQueues.cameraQueue.async {
      withPromise(promise) {
        guard self.recordingSession != nil else {
          // there's no active recording!
          throw CameraError.capture(.noRecordingInProgress)
        }
        self.isRecording = false
        return nil
      }
    }
  }

  /**
   Resumes an active, but paused recording.
   */
  func resumeRecording(promise: Promise) {
    CameraQueues.cameraQueue.async {
      withPromise(promise) {
        guard self.recordingSession != nil else {
          // there's no active recording!
          throw CameraError.capture(.noRecordingInProgress)
        }
        self.isRecording = true
        return nil
      }
    }
  }

  private func recommendedVideoSettings(videoOutput: AVCaptureVideoDataOutput,
                                        fileType: AVFileType,
                                        videoCodec: AVVideoCodecType?) -> [String: Any]? {
    if videoCodec != nil {
      return videoOutput.recommendedVideoSettings(forVideoCodecType: videoCodec!, assetWriterOutputFileType: fileType)
    } else {
      return videoOutput.recommendedVideoSettingsForAssetWriter(writingTo: fileType)
    }
  }
}
