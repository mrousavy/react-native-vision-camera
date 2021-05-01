//
//  CameraView+RecordVideo.swift
//  Cuvent
//
//  Created by Marc Rousavy on 16.12.20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import AVFoundation

private var hasLoggedFrameDropWarning = false

extension CameraView: AVCaptureVideoDataOutputSampleBufferDelegate {
  func startRecording(options: NSDictionary, callback: @escaping RCTResponseSenderBlock) {
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
      
      // TODO: The startRecording() func cannot be async because RN doesn't allow
      //       both a callback and a Promise in a single function. Wait for TurboModules?
      //       This means that any errors that occur in this function have to be delegated through
      //       the callback, but I'd prefer for them to throw for the original function instead.
      
      recordingSession = try RecordingSession(url: tempURL, fileType: .mov, outputSettings: [:])
      
      isRecording = true
    } catch let error as NSError {
      return callback([NSNull(), makeReactError(.capture(.createTempFileError), cause: error)])
    }
  }

  func stopRecording(promise: Promise) {
    isRecording = false
    guard let recordingSession = self.recordingSession else {
      return promise.reject(error: .capture(.noRecordingInProgress))
    }
    recordingSession.finish { status, error in
      if let error = error {
        return promise.reject(error: .capture(.fileError), cause: error as NSError)
      }
      if status == AVAssetWriter.Status.completed {
        return promise.resolve([
          "path": recordingSession.url.absoluteString,
          "duration": recordingSession.duration
        ])
      } else {
        promise.reject(error: .capture(.unknown(message: "AVAssetWriter completed with status: \(status.descriptor)")))
      }
    }
  }
  
  func pauseRecording(promise: Promise) {
    withPromise(promise) {
      if isRecording {
        isRecording = false
        return nil
      } else {
        throw CameraError.capture(.noRecordingInProgress)
      }
    }
  }
  
  func resumeRecording(promise: Promise) {
    withPromise(promise) {
      if !isRecording {
        isRecording = true
        return nil
      } else {
        throw CameraError.capture(.noRecordingInProgress)
      }
    }
  }

  public func captureOutput(_: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from _: AVCaptureConnection) {
    if isRecording {
      guard let recordingSession = recordingSession else {
        return invokeOnError(.capture(.unknown(message: "isRecording was true but the RecordingSession was null!")))
      }
      recordingSession.appendBuffer(sampleBuffer)
    }
    
    if let frameProcessor = frameProcessorCallback {
      // check if last frame was x nanoseconds ago, effectively throttling FPS
      let diff = DispatchTime.now().uptimeNanoseconds - self.lastFrameProcessorCall.uptimeNanoseconds
      let secondsPerFrame = 1.0 / self.frameProcessorFps.doubleValue
      let nanosecondsPerFrame = secondsPerFrame * 1_000_000_000.0
      if diff > UInt64(nanosecondsPerFrame) {
        frameProcessor(sampleBuffer)
        self.lastFrameProcessorCall = DispatchTime.now()
      }
    }
  }

  public func captureOutput(_: AVCaptureOutput, didDrop _: CMSampleBuffer, from _: AVCaptureConnection) {
    if !hasLoggedFrameDropWarning {
      // TODO: Show in React console?
      ReactLogger.log(level: .warning, message: "Dropped a Frame. This might indicate that your Frame Processor is doing too much work. " +
        "Either throttle the frame processor's frame rate, or optimize your frame processor's execution speed.")
      hasLoggedFrameDropWarning = true
    }
  }
}
