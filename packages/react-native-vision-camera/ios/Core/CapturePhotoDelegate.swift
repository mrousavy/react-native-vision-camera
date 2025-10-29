//
//  CapturePhotoDelegate.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import Foundation
import AVFoundation

class CapturePhotoDelegate: NSObject, AVCapturePhotoCaptureDelegate {
  // Statically cache delegates because the AVCaptureOutput only captures them weakly
  private static var delegates: [CapturePhotoDelegate] = []
  
  private let onCaptured: (AVCapturePhoto) -> Void
  private let onError: (any Error) -> Void
  private let callbacks: CapturePhotoCallbacks
  private var didResolve = false
  
  init(onCaptured: @escaping (AVCapturePhoto) -> Void,
       onError: @escaping (any Error) -> Void,
       callbacks: CapturePhotoCallbacks) {
    self.onCaptured = onCaptured
    self.onError = onError
    self.callbacks = callbacks
    super.init()
    // Add a static strong reference while capture is in progress
    CapturePhotoDelegate.delegates.append(self)
  }
  
  // 1. Begin capture process
  func photoOutput(_ output: AVCapturePhotoOutput, willBeginCaptureFor resolvedSettings: AVCaptureResolvedPhotoSettings) {
    callbacks.onWillBeginCapture?()
  }
  
  // 2. About to capture photo
  func photoOutput(_ output: AVCapturePhotoOutput, willCapturePhotoFor resolvedSettings: AVCaptureResolvedPhotoSettings) {
    callbacks.onWillCapturePhoto?()
  }
  
  // 3. Captured actual photo (or error)
  func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: (any Error)?) {
    if let error {
      onError(error)
    } else {
      onCaptured(photo)
    }
    didResolve = true
  }
  
  // 4. Photo capture done
  func photoOutput(_ output: AVCapturePhotoOutput, didCapturePhotoFor resolvedSettings: AVCaptureResolvedPhotoSettings) {
    callbacks.onDidCapturePhoto?()
  }
  
  // 5. Capture process done
  func photoOutput(_ output: AVCapturePhotoOutput, didFinishCaptureFor resolvedSettings: AVCaptureResolvedPhotoSettings, error: (any Error)?) {
    if let error {
      if !didResolve {
        onError(error)
      }
    }
    callbacks.onDidFinishCapture?()
    // Remove the static strong reference, we're done
    CapturePhotoDelegate.delegates.removeAll { $0 == self }
  }
  
  @available(iOS 17.0, *)
  func photoOutput(_ output: AVCapturePhotoOutput, didFinishCapturingDeferredPhotoProxy deferredPhotoProxy: AVCaptureDeferredPhotoProxy?, error: (any Error)?) {
    fatalError("didFinishCapturingDeferredPhotoProxy: is not yet implemented!")
  }
  
  func photoOutput(_ output: AVCapturePhotoOutput, didFinishRecordingLivePhotoMovieForEventualFileAt outputFileURL: URL, resolvedSettings: AVCaptureResolvedPhotoSettings) {
    fatalError("didFinishRecordingLivePhotoMovieForEventualFileAt: is not yet implemented!")
  }
  
  func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingLivePhotoToMovieFileAt outputFileURL: URL, duration: CMTime, photoDisplayTime: CMTime, resolvedSettings: AVCaptureResolvedPhotoSettings, error: (any Error)?) {
    fatalError("didFinishProcessingLivePhotoToMovieFileAt: is not yet implemented!")
  }
}
