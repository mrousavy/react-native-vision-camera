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

// Bayer/ProRes RAW formats that cannot be encoded directly
private let kBayerFormats: Set<OSType> = [
  0x6274_7032, // btp2 - Bayer To ProRes 2
  0x6274_7033, // btp3 - Bayer To ProRes 3
  0x6270_3136, // bp16 - 16-bit Bayer
  0x6270_3234, // bp24 - 24-bit Bayer
  0x6270_3332, // bp32 - 32-bit Bayer
]

extension CameraSession {
  /**
   Starts a video + audio recording with a custom Asset Writer.
   */
  func startRecording(options: RecordVideoOptions,
                      onVideoRecorded: @escaping (_ video: Video) -> Void,
                      onError: @escaping (_ error: CameraError) -> Void,
                      onBytesWritten: @escaping (_ bytes: Double) -> Void) {
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
        CameraQueues.cameraQueue.async {
          defer {
            if enableAudio {
              CameraQueues.audioQueue.async {
                self.deactivateAudioSession()
              }
            }
          }

          self.recordingSession = nil
          self.recordingSizeTimer?.cancel()
          self.recordingSizeTimer = nil

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
            if error.code == INSUFFICIENT_STORAGE_ERROR_CODE {
              onError(.capture(.insufficientStorage))
            } else {
              onError(.capture(.unknown(message: "An unknown recording error occured! \(error.code) \(error.description)")))
            }
          } else {
            if status == .completed {
              let video = Video(path: recordingSession.url.absoluteString,
                                duration: recordingSession.duration,
                                size: recordingSession.size)
              onVideoRecorded(video)
            } else {
              onError(.unknown(message: "AVAssetWriter completed with status: \(status.descriptor)"))
            }
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

        // Init Audio
        if enableAudio,
           let audioOutput = self.audioOutput,
           let audioInput = self.audioDeviceInput {
          VisionLogger.log(level: .info, message: "Enabling Audio for Recording...")
          CameraQueues.audioQueue.async {
            do {
              try self.activateAudioSession()
            } catch {
              self.onConfigureError(error)
            }
          }

          let audioSettings = audioOutput.recommendedAudioSettingsForAssetWriter(writingTo: options.fileType)
          try recordingSession.initializeAudioTrack(withSettings: audioSettings,
                                                    format: audioInput.device.activeFormat.formatDescription)
        }

        // Get device's native pixel format to detect Bayer formats
        let devicePixelFormat: OSType? = self.videoDeviceInput.map { input in
          CMFormatDescriptionGetMediaSubType(input.device.activeFormat.formatDescription)
        }

        // Check if device format is a Bayer/ProRes RAW format
        let isBayerFormat = devicePixelFormat.map { kBayerFormats.contains($0) } ?? false

        // Get available output formats
        let availableFormats = videoOutput.availableVideoPixelFormatTypes

        // Check what standard formats are available
        let has420f = availableFormats.contains(kCVPixelFormatType_420YpCbCr8BiPlanarFullRange)
        let has420v = availableFormats.contains(kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange)
        let hasBGRA = availableFormats.contains(kCVPixelFormatType_32BGRA)

        // Select compatible output format - always force a compatible format for recording
        var selectedFormat: OSType?
        var forceH264 = false

        // Priority: 420f > 420v > BGRA (for best compatibility)
        if has420f {
          selectedFormat = kCVPixelFormatType_420YpCbCr8BiPlanarFullRange
        } else if has420v {
          selectedFormat = kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange
        } else if hasBGRA {
          selectedFormat = kCVPixelFormatType_32BGRA
          forceH264 = true // BGRA works better with H.264
        } else if let firstFormat = availableFormats.first {
          selectedFormat = firstFormat
        }

        // Apply the selected format to video output
        if let format = selectedFormat {
          videoOutput.videoSettings = [
            String(kCVPixelBufferPixelFormatTypeKey): format,
          ]
          VisionLogger.log(level: .info,
                           message: "Set output format to: \(format.fourCCString) " +
                             "(deviceFormat: \(devicePixelFormat?.fourCCString ?? "nil"), isBayer: \(isBayerFormat))")
        }

        // Get the actual pixel format that will be used
        var actualPixelFormat: OSType?
        if let pixelFormatValue = videoOutput.videoSettings[String(kCVPixelBufferPixelFormatTypeKey)] {
          if let numberValue = pixelFormatValue as? NSNumber {
            actualPixelFormat = OSType(numberValue.uint32Value)
          } else if let osTypeValue = pixelFormatValue as? OSType {
            actualPixelFormat = osTypeValue
          }
        }

        // Get video settings with proper codec selection
        let videoSettings = try videoOutput.recommendedVideoSettings(forOptions: options,
                                                                     devicePixelFormat: actualPixelFormat,
                                                                     forceH264: forceH264)

        VisionLogger.log(level: .info, message: "Video encoder settings: \(videoSettings)")

        // Initialize video track
        try recordingSession.initializeVideoTrack(withSettings: videoSettings)

        // Start recording
        try recordingSession.start()
        self.didCancelRecording = false
        self.recordingSession = recordingSession

        let timer = DispatchSource.makeTimerSource(queue: CameraQueues.cameraQueue)
        timer.schedule(deadline: .now(), repeating: 0.4)

        timer.setEventHandler {
          guard let session = self.recordingSession else {
            timer.cancel()
            return
          }

          let path = session.url.path
          if let size = try? FileManager.default.attributesOfItem(atPath: path)[.size] as? NSNumber {
            let bytes = size.doubleValue
            onBytesWritten(bytes)
          }
        }
        self.recordingSizeTimer = timer
        self.recordingSizeTimer?.resume()
        let end = DispatchTime.now()
        VisionLogger.log(level: .info,
                         message: "Recording started in \(Double(end.uptimeNanoseconds - start.uptimeNanoseconds) / 1_000_000)ms!")
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
          VisionLogger.log(level: .warning, message: "stopRecording() was called but there is no active recording session.")
          return nil
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
