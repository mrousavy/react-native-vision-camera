//
//  CameraView+RecordVideo.swift
//  mrousavy
//
//  Created by Marc Rousavy on 16.12.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import AVFoundation

// MARK: - CameraView + AVCaptureVideoDataOutputSampleBufferDelegate, AVCaptureAudioDataOutputSampleBufferDelegate

extension CameraView: AVCaptureVideoDataOutputSampleBufferDelegate, AVCaptureAudioDataOutputSampleBufferDelegate {
  /**
   Starts a video + audio recording with a custom Asset Writer.
   */
  func startRecording(options: NSDictionary, callback jsCallbackFunc: @escaping RCTResponseSenderBlock) {
    CameraQueues.cameraQueue.async {
      ReactLogger.log(level: .info, message: "Starting Video recording...")
      let callback = Callback(jsCallbackFunc)

      var fileType = AVFileType.mov
      if let fileTypeOption = options["fileType"] as? String {
        guard let parsed = try? AVFileType(withString: fileTypeOption) else {
          callback.reject(error: .parameter(.invalid(unionName: "fileType", receivedValue: fileTypeOption)))
          return
        }
        fileType = parsed
      }

      let errorPointer = ErrorPointer(nilLiteral: ())
      let fileExtension = fileType.descriptor ?? "mov"
      guard let tempFilePath = RCTTempFilePath(fileExtension, errorPointer) else {
        callback.reject(error: .capture(.createTempFileError), cause: errorPointer?.pointee)
        return
      }

      ReactLogger.log(level: .info, message: "File path: \(tempFilePath)")
      let tempURL = URL(string: "file://\(tempFilePath)")!

      if let flashMode = options["flash"] as? String {
        // use the torch as the video's flash
        self.setTorchMode(flashMode)
      }

      guard let videoOutput = self.videoOutput else {
        if self.video?.boolValue == true {
          callback.reject(error: .session(.cameraNotReady))
          return
        } else {
          callback.reject(error: .capture(.videoNotEnabled))
          return
        }
      }
      guard let videoInput = self.videoDeviceInput else {
        callback.reject(error: .session(.cameraNotReady))
        return
      }

      // TODO: The startRecording() func cannot be async because RN doesn't allow
      //       both a callback and a Promise in a single function. Wait for TurboModules?
      //       This means that any errors that occur in this function have to be delegated through
      //       the callback, but I'd prefer for them to throw for the original function instead.

      let enableAudio = self.audio?.boolValue == true

      let onFinish = { (recordingSession: RecordingSession, status: AVAssetWriter.Status, error: Error?) in
        defer {
          if enableAudio {
            CameraQueues.audioQueue.async {
              self.deactivateAudioSession()
            }
          }
          if options["flash"] != nil {
            // Set torch mode back to what it was before if we used it for the video flash.
            self.setTorchMode(self.torch)
          }
        }

        self.recordingSession = nil
        self.isRecording = false
        ReactLogger.log(level: .info, message: "RecordingSession finished with status \(status.descriptor).")

        if let error = error as NSError? {
          if error.domain == "capture/aborted" {
            callback.reject(error: .capture(.aborted), cause: error)
          } else {
            callback.reject(error: .capture(.unknown(message: "An unknown recording error occured! \(error.description)")), cause: error)
          }
        } else {
          if status == .completed {
            callback.resolve([
              "path": recordingSession.url.absoluteString,
              "duration": recordingSession.duration,
            ])
          } else {
            callback.reject(error: .unknown(message: "AVAssetWriter completed with status: \(status.descriptor)"))
          }
        }
      }

      let recordingSession: RecordingSession
      do {
        recordingSession = try RecordingSession(url: tempURL,
                                                fileType: fileType,
                                                completion: onFinish)
      } catch let error as NSError {
        callback.reject(error: .capture(.createRecorderError(message: nil)), cause: error)
        return
      }
      self.recordingSession = recordingSession

      var videoCodec: AVVideoCodecType?
      if let codecString = options["videoCodec"] as? String {
        videoCodec = AVVideoCodecType(withString: codecString)
      }

      // Init Video
      guard var videoSettings = self.recommendedVideoSettings(videoOutput: videoOutput, fileType: fileType, videoCodec: videoCodec),
            !videoSettings.isEmpty else {
        callback.reject(error: .capture(.createRecorderError(message: "Failed to get video settings!")))
        return
      }

      // Custom Video Bit Rate (Mbps -> bps)
      if let videoBitRate = options["videoBitRate"] as? NSNumber {
        let bitsPerSecond = videoBitRate.doubleValue * 1_000_000
        videoSettings[AVVideoCompressionPropertiesKey] = [
          AVVideoAverageBitRateKey: NSNumber(value: bitsPerSecond),
        ]
      }

      // get pixel format (420f, 420v, x420)
      let pixelFormat = CMFormatDescriptionGetMediaSubType(videoInput.device.activeFormat.formatDescription)
      recordingSession.initializeVideoWriter(withSettings: videoSettings,
                                             pixelFormat: pixelFormat)

      // Init Audio (optional)
      if enableAudio {
        // Activate Audio Session asynchronously
        CameraQueues.audioQueue.async {
          self.activateAudioSession()
        }

        if let audioOutput = self.audioOutput,
           let audioSettings = audioOutput.recommendedAudioSettingsForAssetWriter(writingTo: fileType) {
          recordingSession.initializeAudioWriter(withSettings: audioSettings)
        }
      }

      // start recording session with or without audio.
      do {
        try recordingSession.startAssetWriter()
      } catch let error as NSError {
        callback.reject(error: .capture(.createRecorderError(message: "RecordingSession failed to start asset writer.")), cause: error)
        return
      }
      self.isRecording = true
    }
  }

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

  public final func captureOutput(_ captureOutput: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from _: AVCaptureConnection) {
    #if VISION_CAMERA_ENABLE_FRAME_PROCESSORS
      if captureOutput is AVCaptureVideoDataOutput {
        if let frameProcessor = frameProcessor {
          // Call Frame Processor
          let frame = Frame(buffer: sampleBuffer, orientation: bufferOrientation)
          frameProcessor.call(frame)
        }
      }
    #endif

    // Record Video Frame/Audio Sample to File
    if isRecording {
      guard let recordingSession = recordingSession else {
        invokeOnError(.capture(.unknown(message: "isRecording was true but the RecordingSession was null!")))
        return
      }

      switch captureOutput {
      case is AVCaptureVideoDataOutput:
        recordingSession.appendBuffer(sampleBuffer, type: .video, timestamp: CMSampleBufferGetPresentationTimeStamp(sampleBuffer))
      case is AVCaptureAudioDataOutput:
        let timestamp = CMSyncConvertTime(CMSampleBufferGetPresentationTimeStamp(sampleBuffer),
                                          from: audioCaptureSession.masterClock ?? CMClockGetHostTimeClock(),
                                          to: captureSession.masterClock ?? CMClockGetHostTimeClock())
        recordingSession.appendBuffer(sampleBuffer, type: .audio, timestamp: timestamp)
      default:
        break
      }
    }

    #if DEBUG
      if captureOutput is AVCaptureVideoDataOutput {
        // Update FPS Graph per Frame
        if let fpsGraph = fpsGraph {
          DispatchQueue.main.async {
            fpsGraph.onTick(CACurrentMediaTime())
          }
        }
      }
    #endif
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

  /**
   Gets the orientation of the CameraView's images (CMSampleBuffers).
   */
  private var bufferOrientation: UIImage.Orientation {
    guard let cameraPosition = videoDeviceInput?.device.position else {
      return .up
    }

    switch outputOrientation {
    case .portrait:
      return cameraPosition == .front ? .leftMirrored : .right
    case .landscapeLeft:
      return cameraPosition == .front ? .downMirrored : .up
    case .portraitUpsideDown:
      return cameraPosition == .front ? .rightMirrored : .left
    case .landscapeRight:
      return cameraPosition == .front ? .upMirrored : .down
    case .unknown:
      return .up
    @unknown default:
      return .up
    }
  }
}
