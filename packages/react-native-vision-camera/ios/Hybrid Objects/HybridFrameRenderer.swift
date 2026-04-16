///
/// HybridFrameRenderer.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

final class HybridFrameRenderer: HybridFrameRendererSpec, NativeFrameRenderer {
  let layer = AVSampleBufferDisplayLayer()

  func renderFrame(frame: any HybridFrameSpec) throws {
    guard let hybridFrame = frame as? any NativeFrame else {
      throw RuntimeError.error(withMessage: "Frame \(frame) is not of type `NativeFrame`!")
    }
    guard let sampleBuffer = hybridFrame.sampleBuffer else {
      throw RuntimeError.error(
        withMessage: "Frame \(hybridFrame) does not have a valid `.sampleBuffer`!")
    }

    self.layer.enqueue(sampleBuffer)
    if self.layer.requiresFlushToResumeDecoding {
      self.layer.flush()
    }
    if self.layer.status == .failed {
      throw RuntimeError.error(withMessage: "Failed to render Frame!")
    }
  }
}
