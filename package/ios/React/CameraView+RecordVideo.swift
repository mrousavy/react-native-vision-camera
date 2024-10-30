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
  func startRecording(options: NSDictionary, callback jsCallback: @escaping RCTResponseSenderBlock) {
    // Type-safety
    let callback = Callback(jsCallback)

    do {
      let options = try RecordVideoOptions(fromJSValue: options,
                                           bitRateOverride: videoBitRateOverride?.doubleValue,
                                           bitRateMultiplier: videoBitRateMultiplier?.doubleValue)

      // Start Recording with success and error callbacks
      cameraSession.startRecording(
        options: options,
        onVideoRecorded: { video in
          callback.resolve(video.toJSValue())
        },
        onError: { error in
          callback.reject(error: error)
        }
      )
    } catch {
      // Some error occured while initializing VideoSettings
      if let error = error as? CameraError {
        callback.reject(error: error)
      } else {
        callback.reject(error: .capture(.unknown(message: error.localizedDescription)), cause: error as NSError)
      }
    }
  }

  func stopRecording(promise: Promise) {
    cameraSession.stopRecording(promise: promise)
  }

  func cancelRecording(promise: Promise) {
    cameraSession.cancelRecording(promise: promise)
  }

  func pauseRecording(promise: Promise) {
    cameraSession.pauseRecording(promise: promise)
  }

  func resumeRecording(promise: Promise) {
    cameraSession.resumeRecording(promise: promise)
  }
}
