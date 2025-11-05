//
//  FrameDelegate.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.11.25.
//

import Foundation
import AVFoundation

class FrameDelegate: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
  var onFrame: ((CMSampleBuffer, Orientation) -> Void)?
  var onFrameDropped: ((CMSampleBuffer) -> Void)?
  
  func captureOutput(_ output: AVCaptureOutput, didDrop sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    if let onFrameDropped {
      onFrameDropped(sampleBuffer)
    }
  }
  
  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    if let onFrame {
      let orientation = connection.orientation
      onFrame(sampleBuffer, orientation)
    }
  }
}
