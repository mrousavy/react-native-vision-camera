//
//  TextRecognitionDelegate.swift
//  VisionCameraTextRecognition
//

import AVFoundation
import Foundation

final class TextRecognitionDelegate: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
  private let onSampleBuffer: (CMSampleBuffer) -> Void

  init(onSampleBuffer: @escaping (CMSampleBuffer) -> Void) {
    self.onSampleBuffer = onSampleBuffer
    super.init()
  }

  func captureOutput(
    _ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer,
    from connection: AVCaptureConnection
  ) {
    onSampleBuffer(sampleBuffer)
  }
}
