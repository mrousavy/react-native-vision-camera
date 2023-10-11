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
