//
//  FrameProcessorDelegate.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 26.02.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import AVFoundation
import Foundation

class FrameProcessorDelegate: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
  public let queue = DispatchQueue(label: "com.mrousavy.camera-queue-frame-processor",
                                                 qos: .userInteractive,
                                                 attributes: [],
                                                 autoreleaseFrequency: .inherit,
                                                 target: nil)
  private let frameProcessor: FrameProcessor

  init(withFrameProcessor frameProcessor: @escaping FrameProcessor) {
    self.frameProcessor = frameProcessor
    super.init()
  }

  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    // TODO: Actually call jsi::Function (worklet) using the REA interface, I don't think this works:
    frameProcessor([sampleBuffer])
  }
}
