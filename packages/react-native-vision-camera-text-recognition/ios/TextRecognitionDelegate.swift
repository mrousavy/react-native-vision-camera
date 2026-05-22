//
//  TextRecognitionDelegate.swift
//  VisionCameraTextRecognition
//

import AVFoundation
import Foundation

final class TextRecognitionDelegate: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
  private let onSampleBuffer: (CMSampleBuffer, AVCaptureDevice.Position) -> Void

  init(onSampleBuffer: @escaping (CMSampleBuffer, AVCaptureDevice.Position) -> Void) {
    self.onSampleBuffer = onSampleBuffer
    super.init()
  }

  func captureOutput(
    _ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer,
    from connection: AVCaptureConnection
  ) {
    let cameraPosition = connection.inputPorts.lazy
      .compactMap { $0.input as? AVCaptureDeviceInput }
      .first?
      .device.position ?? .unspecified
    onSampleBuffer(sampleBuffer, cameraPosition)
  }
}
