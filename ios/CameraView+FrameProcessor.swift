//
//  CameraView+FrameProcessor.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 26.02.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation
import AVFoundation

extension CameraView: AVCaptureVideoDataOutputSampleBufferDelegate {
  public func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    guard let frameProcessor = self.frameProcessor else {
      ReactLogger.log(level: .error, message: "Frame Processor function is null but the video stream submitted a new frame! This indicates a memory leak.")
      return
    }
    
    frameProcessor([1])
  }
}
