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

private let INSUFFICIENT_STORAGE_ERROR_CODE = -11807

extension CameraSession {
  /**
   Starts a video + audio recording with a custom Asset Writer.
   */
  func startRecording(options: RecordVideoOptions,
                      onVideoRecorded: @escaping (_ video: Video) -> Void,
                      onError: @escaping (_ error: CameraError) -> Void) {
    // Run on Camera Queue
    CameraQueues.cameraQueue.async {
      let start = DispatchTime.now()
      VisionLogger.log(level: .info, message: "Starting Video recording...")

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
        }

        self.recordingSession = nil

        if self.didCancelRecording {
          VisionLogger.log(level: .info, message: "RecordingSession finished because the recording was canceled.")
          onError(.capture(.recordingCanceled))
          do {
            VisionLogger.log(level: .info, message: "Deleting temporary video file...")
            try FileManager.default.removeItem(at: recordingSession.url)
          } catch {
            self.delegate?.onError(.capture(.fileError(cause: error)))
          }
          return
        }

        VisionLogger.log(level: .info, message: "RecordingSession finished with status \(status.descriptor).")

        if let error = error as NSError? {
          VisionLogger.log(level: .error, message: "RecordingSession Error \(error.code): \(error.description)")
          // Something went wrong, we have an error
          if error.code == INSUFFICIENT_STORAGE_ERROR_CODE {
            onError(.capture(.insufficientStorage))
          } else {
            onError(.capture(.unknown(message: "An unknown recording error occured! \(error.code) \(error.description)")))
          }
        } else {
          if status == .completed {
            // Recording was successfully saved
            let video = Video(path: recordingSession.url.absoluteString,
                              duration: recordingSession.duration,
                              size: recordingSession.size)
            onVideoRecorded(video)
          } else {
            // Recording wasn't saved and we don't have an error either.
            onError(.unknown(message: "AVAssetWriter completed with status: \(status.descriptor)"))
          }
        }
      }

      VisionLogger.log(level: .info, message: "Starting recording into file: \(options.path)")

      do {
        // Orientation is relative to our current output orientation
        let orientation = self.outputOrientation.relativeTo(orientation: videoOutput.orientation)

        // Create RecordingSession for the temp file
        let recordingSession = try RecordingSession(url: options.path,
                                                    fileType: options.fileType,
                                                    metadataProvider: self.metadataProvider,
                                                    clock: self.captureSession.clock,
                                                    orientation: orientation,
                                                    completion: onFinish)

        // Init Audio + Activate Audio Session (optional)
        if enableAudio,
           let audioOutput = self.audioOutput,
           let audioInput = self.audioDeviceInput {
          VisionLogger.log(level: .info, message: "Enabling Audio for Recording...")
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
          try recordingSession.initializeAudioTrack(withSettings: audioSettings,
                                                    format: audioInput.device.activeFormat.formatDescription)
        }

        // Init Video
        let videoSettings = try videoOutput.recommendedVideoSettings(forOptions: options)
        try recordingSession.initializeVideoTrack(withSettings: videoSettings)

        // start recording session with or without audio.
        try recordingSession.start()
        self.didCancelRecording = false
        self.recordingSession = recordingSession

        let end = DispatchTime.now()
        VisionLogger.log(level: .info, message: "RecordingSesssion started in \(Double(end.uptimeNanoseconds - start.uptimeNanoseconds) / 1_000_000)ms!")
      } catch let error as CameraError {
        onError(error)
      } catch let error as NSError {
        onError(.capture(.createRecorderError(message: "RecordingSession failed with unknown error: \(error.description)")))
      }
    }
  }

  /**
   Stops an active recording.
   */
  func stopRecording(promise: Promise) {
    CameraQueues.cameraQueue.async {
      withPromise(promise) {
        guard let recordingSession = self.recordingSession else {
          throw CameraError.capture(.noRecordingInProgress)
        }
        recordingSession.stop()
        return nil
      }
    }
  }

  /**
   Cancels an active recording.
   */
  func cancelRecording(promise: Promise) {
    didCancelRecording = true
    stopRecording(promise: promise)
  }

  /**
   Pauses an active recording.
   */
  func pauseRecording(promise: Promise) {
    CameraQueues.cameraQueue.async {
      withPromise(promise) {
        guard let recordingSession = self.recordingSession else {
          throw CameraError.capture(.noRecordingInProgress)
        }
        recordingSession.pause()
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
        guard let recordingSession = self.recordingSession else {
          throw CameraError.capture(.noRecordingInProgress)
        }
        recordingSession.resume()
        return nil
      }
    }
  }
}
