//
//  AudioFrameDelegate.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 07.01.26.
//

import AVFoundation
import Foundation

final class AudioFrameDelegate: NSObject, AVCaptureAudioDataOutputSampleBufferDelegate {
  var onFrame: ((CMSampleBuffer, CMTime) -> Void)?
  var onFrameDropped: ((CMSampleBuffer) -> Void)?

  func captureOutput(
    _ output: AVCaptureOutput, didDrop sampleBuffer: CMSampleBuffer,
    from connection: AVCaptureConnection
  ) {
    if let onFrameDropped {
      onFrameDropped(sampleBuffer)
    }
  }

  func captureOutput(
    _ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer,
    from connection: AVCaptureConnection
  ) {
    if let onFrame {
      onFrame(sampleBuffer, sampleBuffer.presentationTimeStamp)
    }
  }
}
