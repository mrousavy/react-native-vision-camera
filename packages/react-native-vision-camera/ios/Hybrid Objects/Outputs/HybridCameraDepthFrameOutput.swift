///
/// HybridCameraDepthFrameOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraDepthFrameOutput: HybridCameraDepthFrameOutputSpec, NativeCameraOutput {
  private let depthOutput: AVCaptureDepthDataOutput
  private let delegate: DepthFrameDelegate
  private let queue: DispatchQueue
  let outputType: CameraOutputType = .stream
  let mediaType: MediaType = .depth
  var output: AVCaptureOutput {
    return depthOutput
  }

  init(targetPixelFormat: TargetDepthPixelFormat) {
    self.depthOutput = AVCaptureDepthDataOutput()
    self.delegate = DepthFrameDelegate()
    self.queue = DispatchQueue(label: "com.margelo.camera.depth",
                               qos: .userInteractive,
                               attributes: [],
                               autoreleaseFrequency: .inherit,
                               target: nil)
    super.init()

    // Set up our `delegate`
    depthOutput.setDelegate(delegate, callbackQueue: queue)
    // Configure `videoSettings`
    depthOutput.alwaysDiscardsLateDepthData = true
    depthOutput.isFilteringEnabled = true
  }

  var thread: any HybridNativeThreadSpec {
    return HybridNativeThread(queue: queue)
  }

  func setOnDepthFrameCallback(onDepthFrame: ((any HybridDepthSpec) -> Bool)?) throws {
    if let onDepthFrame {
      delegate.onDepthFrame = { (depth, timestamp, orientation) in
        let depth = HybridDepth(depthData: depth,
                                timestamp: timestamp,
                                orientation: orientation)
        _ = onDepthFrame(depth)
      }
    } else {
      delegate.onDepthFrame = nil
    }
  }

  func setOnDepthFrameDroppedCallback(onDepthFrameDropped: ((FrameDroppedReason) -> Void)?) throws {
    if let onDepthFrameDropped {
      delegate.onDepthFrameDropped = { avReason in
        let reason = FrameDroppedReason(reason: avReason)
        onDepthFrameDropped(reason)
      }
    } else {
      delegate.onDepthFrameDropped = nil
    }
  }
}
