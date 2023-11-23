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
      let options = try RecordVideoOptions(fromJSValue: options)

      // If flash is on, just enable torch
      if options.flash != .off {
        cameraSession.configure { config in
          config.torch = options.flash
        }
      }

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

    // If flash was used, we had the torch enabled. Now set it back to it's original state.
    cameraSession.configure { config in
      config.torch = try Torch(jsValue: torch)
    }
  }

  func pauseRecording(promise: Promise) {
    cameraSession.pauseRecording(promise: promise)
  }

  func resumeRecording(promise: Promise) {
    cameraSession.resumeRecording(promise: promise)
  }
}
