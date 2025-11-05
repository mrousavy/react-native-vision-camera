//
//  HybridFrame.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import Foundation
import AVFoundation
import NitroModules
import NitroImage

class HybridFrame: HybridFrameSpec {
  let sampleBuffer: CMSampleBuffer
  
  init(buffer: CMSampleBuffer) {
    self.sampleBuffer = buffer
    super.init()
  }

  var memorySize: Int {
    return sampleBuffer.memorySize
  }
  
  var timestamp: Double {
    return sampleBuffer.presentationTimeStamp.seconds
  }
  
  private var pixelBuffer: CVPixelBuffer? {
    guard sampleBuffer.isValid else {
      return nil
    }
    return sampleBuffer.imageBuffer
  }
  
  var width: Double {
    guard let pixelBuffer else {
      return 0
    }
    return Double(CVPixelBufferGetWidth(pixelBuffer))
  }
  
  var height: Double {
    guard let pixelBuffer else {
      return 0
    }
    return Double(CVPixelBufferGetHeight(pixelBuffer))
  }
  
  var isValid: Bool {
    return sampleBuffer.isValid
  }
  
  func dispose() {
    try? sampleBuffer.invalidate()
  }

  func getPixelBuffer() throws -> ArrayBuffer {
    guard isValid else {
      throw RuntimeError.error(withMessage: "This Frame is invalid!")
    }
    guard let pixelBuffer else {
      throw RuntimeError.error(withMessage: "This Frame does not contain a Pixel Buffer!")
    }
    return try ArrayBuffer.fromPixelBuffer(pixelBuffer)
  }
}
