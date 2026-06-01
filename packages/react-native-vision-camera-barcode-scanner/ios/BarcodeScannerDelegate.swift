//
//  BarcodeScannerDelegate.swift
//  VisionCameraBarcodeScanner
//
//  Created by Marc Rousavy on 08.02.26.
//

import AVFoundation
import Foundation

final class BarcodeScannerDelegate: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
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
