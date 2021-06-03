//
//  CameraView+RecordVideo.swift
//  Cuvent
//
//  Created by Marc Rousavy on 16.12.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import AVFoundation

private var hasLoggedFrameDropWarning = false

// MARK: - CameraView + AVCaptureVideoDataOutputSampleBufferDelegate, AVCaptureAudioDataOutputSampleBufferDelegate

extension CameraView: AVCaptureVideoDataOutputSampleBufferDelegate, AVCaptureAudioDataOutputSampleBufferDelegate {
  /**
   Starts a video + audio recording with a custom Asset Writer.
   */
  func startRecording(options: NSDictionary, callback: @escaping RCTResponseSenderBlock) {
    cameraQueue.async {
      ReactLogger.log(level: .info, message: "Starting Video recording...")

      do {
        let errorPointer = ErrorPointer(nilLiteral: ())
        guard let tempFilePath = RCTTempFilePath("mov", errorPointer) else {
          return callback([NSNull(), makeReactError(.capture(.createTempFileError), cause: errorPointer?.pointee)])
        }

        let tempURL = URL(string: "file://\(tempFilePath)")!
        if let flashMode = options["flash"] as? String {
          // use the torch as the video's flash
          self.setTorchMode(flashMode)
        }

        var fileType = AVFileType.mov
        if let fileTypeOption = options["fileType"] as? String {
          fileType = AVFileType(withString: fileTypeOption)
        }

        // TODO: The startRecording() func cannot be async because RN doesn't allow
        //       both a callback and a Promise in a single function. Wait for TurboModules?
        //       This means that any errors that occur in this function have to be delegated through
        //       the callback, but I'd prefer for them to throw for the original function instead.

        let onFinish = { (status: AVAssetWriter.Status, error: Error?) -> Void in
          defer {
            self.recordingSession = nil
            self.audioQueue.async {
              self.deactivateAudioSession()
            }
          }
          ReactLogger.log(level: .info, message: "RecordingSession finished with status \(status.descriptor).")
          if let error = error {
            let description = (error as NSError).description
            return callback([NSNull(), CameraError.capture(.unknown(message: "An unknown recording error occured! \(description)"))])
          } else {
            if status == .completed {
              return callback([[
                "path": self.recordingSession!.url.absoluteString,
                "duration": self.recordingSession!.duration,
              ], NSNull()])
            } else {
              return callback([NSNull(), CameraError.unknown(message: "AVAssetWriter completed with status: \(status.descriptor)")])
            }
          }
        }

        self.recordingSession = try RecordingSession(url: tempURL,
                                                     fileType: fileType,
                                                     completion: onFinish)

        // Init Video
        guard let videoOutput = self.videoOutput,
              let videoSettings = videoOutput.recommendedVideoSettingsForAssetWriter(writingTo: fileType),
              !videoSettings.isEmpty else {
          throw CameraError.capture(.createRecorderError(message: "Failed to get video settings!"))
        }
        self.recordingSession!.initializeVideoWriter(withSettings: videoSettings,
                                                     isVideoMirrored: self.videoOutput!.isMirrored)

        // Init Audio (optional, async)
        self.audioQueue.async {
          // Activate Audio Session (blocking)
          self.activateAudioSession()
          guard let recordingSession = self.recordingSession else {
            // recording has already been cancelled
            return
          }
          if let audioOutput = self.audioOutput,
             let audioSettings = audioOutput.recommendedAudioSettingsForAssetWriter(writingTo: fileType) as? [String: Any] {
            recordingSession.initializeAudioWriter(withSettings: audioSettings)
          }

          // Finally start recording, with or without audio.
          recordingSession.start()
          self.isRecording = true
        }
      } catch EnumParserError.invalidValue {
        return callback([NSNull(), EnumParserError.invalidValue])
      } catch let error as NSError {
        return callback([NSNull(), makeReactError(.capture(.createTempFileError), cause: error)])
      }
    }
  }

  func stopRecording(promise: Promise) {
    cameraQueue.async {
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

  // TODO: Implement for JS
  func pauseRecording(promise: Promise) {
    cameraQueue.async {
      withPromise(promise) {
        if self.isRecording {
          self.isRecording = false
          return nil
        } else {
          throw CameraError.capture(.noRecordingInProgress)
        }
      }
    }
  }

  // TODO: Implement for JS
  func resumeRecording(promise: Promise) {
    cameraQueue.async {
      withPromise(promise) {
        if !self.isRecording {
          self.isRecording = true
          return nil
        } else {
          throw CameraError.capture(.noRecordingInProgress)
        }
      }
    }
  }

  public final func captureOutput(_ captureOutput: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from _: AVCaptureConnection) {
    if isRecording {
      guard let recordingSession = recordingSession else {
        return invokeOnError(.capture(.unknown(message: "isRecording was true but the RecordingSession was null!")))
      }
      switch captureOutput {
      case is AVCaptureVideoDataOutput:
        recordingSession.appendBuffer(sampleBuffer, type: .video, timestamp: CMSampleBufferGetPresentationTimeStamp(sampleBuffer))
      case is AVCaptureAudioDataOutput:
        let timestamp = CMSyncConvertTime(CMSampleBufferGetPresentationTimeStamp(sampleBuffer),
                                          from: audioCaptureSession.masterClock!,
                                          to: captureSession.masterClock!)
        recordingSession.appendBuffer(sampleBuffer, type: .audio, timestamp: timestamp)
      default:
        break
      }
    }

    if let frameProcessor = frameProcessorCallback, captureOutput is AVCaptureVideoDataOutput {
      // check if last frame was x nanoseconds ago, effectively throttling FPS
      let diff = DispatchTime.now().uptimeNanoseconds - lastFrameProcessorCall.uptimeNanoseconds
      let secondsPerFrame = 1.0 / frameProcessorFps.doubleValue
      let nanosecondsPerFrame = secondsPerFrame * 1_000_000_000.0
      if diff > UInt64(nanosecondsPerFrame) {
        frameProcessor(sampleBuffer)
        lastFrameProcessorCall = DispatchTime.now()
      }
    }
  }

  public final func captureOutput(_ captureOutput: AVCaptureOutput, didDrop buffer: CMSampleBuffer, from _: AVCaptureConnection) {
    #if DEBUG
      if frameProcessorCallback != nil && !hasLoggedFrameDropWarning && captureOutput is AVCaptureVideoDataOutput {
        let reason = findFrameDropReason(inBuffer: buffer)
        ReactLogger.log(level: .warning,
                        message: "Dropped a Frame. This might indicate that your Frame Processor is doing too much work. " +
                          "Either throttle the frame processor's frame rate, or optimize your frame processor's execution speed. Frame drop reason: \(reason)",
                        alsoLogToJS: true)
        hasLoggedFrameDropWarning = true
      }
    #endif
  }

  private final func findFrameDropReason(inBuffer buffer: CMSampleBuffer) -> String {
    var mode: CMAttachmentMode = 0
    guard let reason = CMGetAttachment(buffer,
                                       key: kCMSampleBufferAttachmentKey_DroppedFrameReason,
                                       attachmentModeOut: &mode) else {
      return "unknown"
    }
    return String(describing: reason)
  }
}
