///
/// HybridFrameRenderer.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridFrameRenderer: HybridFrameRendererSpec, NativeFrameRenderer {
  var layer: CALayer {
    return sampleBufferDisplayLayer
  }
  let sampleBufferDisplayLayer = AVSampleBufferDisplayLayer()
  
  func renderFrame(frame: any HybridFrameSpec) throws {
    guard let hybridFrame = frame as? NativeFrame else {
      throw RuntimeError.error(withMessage: "Frame \(frame) is not of type `NativeFrame`!")
    }
    guard let sampleBuffer = hybridFrame.sampleBuffer else {
      throw RuntimeError.error(withMessage: "Frame \(hybridFrame) does not have a valid `.sampleBuffer`!")
    }
    
    self.sampleBufferDisplayLayer.enqueue(sampleBuffer)
    if self.sampleBufferDisplayLayer.requiresFlushToResumeDecoding {
      self.sampleBufferDisplayLayer.flush()
    }
    if self.sampleBufferDisplayLayer.status == .failed {
      throw RuntimeError.error(withMessage: "Failed to render Frame!")
    }
  }
}
