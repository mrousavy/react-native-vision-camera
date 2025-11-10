///
/// HybridFrameRendererView.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridFrameRendererView: HybridFrameRendererViewSpec {
  var view: UIView {
    return sampleBufferDisplayView
  }
  private let sampleBufferDisplayView = SampleBufferDisplayView()
  
  private class SampleBufferDisplayView: UIView {
    override class var layerClass: AnyClass {
      return AVSampleBufferDisplayLayer.self
    }
    var sampleBufferDisplayLayer: AVSampleBufferDisplayLayer {
      return self.layer as! AVSampleBufferDisplayLayer
    }
  }

  func renderFrame(frame: any HybridFrameSpec) throws {
    guard let hybridFrame = frame as? NativeFrame else {
      throw RuntimeError.error(withMessage: "Frame \(frame) is not of type `NativeFrame`!")
    }
    guard let sampleBuffer = hybridFrame.sampleBuffer else {
      throw RuntimeError.error(withMessage: "Frame \(hybridFrame) does not have a valid `.sampleBuffer`!")
    }
    
    let layer = sampleBufferDisplayView.sampleBufferDisplayLayer
    layer.enqueue(sampleBuffer)
    if layer.requiresFlushToResumeDecoding {
      layer.flush()
    }
  }
}
