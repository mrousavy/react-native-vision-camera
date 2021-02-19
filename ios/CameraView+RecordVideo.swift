//
//  CameraView+RecordVideo.swift
//  Cuvent
//
//  Created by Marc Rousavy on 16.12.20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import AVFoundation

extension CameraView {
  func startRecording(options: NSDictionary, callback: @escaping RCTResponseSenderBlock) {
    queue.async {
      guard let movieOutput = self.movieOutput else {
        return callback([NSNull(), makeReactError(.session(.cameraNotReady))])
      }
      if movieOutput.isRecording {
        return callback([NSNull(), makeReactError(.capture(.recordingInProgress))])
      }

      let errorPointer = ErrorPointer(nilLiteral: ())
      guard let tempFilePath = RCTTempFilePath("mov", errorPointer) else {
        return callback([NSNull(), makeReactError(.capture(.createTempFileError), cause: errorPointer?.pointee)])
      }
      let tempURL = URL(string: "file://\(tempFilePath)")!
      if let flashMode = options["flash"] as? String {
        // use the torch as the video's flash
        self.setTorchMode(flashMode)
      }

      movieOutput.startRecording(to: tempURL, recordingDelegate: RecordingDelegateWithCallback(callback: callback, resetTorchMode: {
        // reset torch in case it was used as the video's "flash"
        self.setTorchMode(self.torch)
      }))
      // TODO: The startRecording() func cannot be async because RN doesn't allow both a callback and a Promise in a single function. Wait for TurboModules?
      // return ["path": tempFilePath]
    }
  }

  func stopRecording(promise: Promise) {
    queue.async {
      withPromise(promise) {
        guard let movieOutput = self.movieOutput else {
          throw CameraError.session(SessionError.cameraNotReady)
        }
        if !movieOutput.isRecording {
          throw CameraError.capture(CaptureError.noRecordingInProgress)
        }

        movieOutput.stopRecording()
        return nil
      }
    }
  }
}
