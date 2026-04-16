///
/// HybridCameraDepthFrameOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

class HybridCameraOutputSynchronizer: HybridCameraOutputSynchronizerSpec {
  private let delegate: SynchronizedOutputDelegate
  private let queue: DispatchQueue
  private let synchronizer: AVCaptureDataOutputSynchronizer

  let outputs: [any HybridCameraOutputSpec]

  init(outputs: [any HybridCameraOutputSpec]) throws {
    // TODO: Make sure all outputs are running on the same DispatchQueue!!
    self.queue = DispatchQueue(
      label: "com.margelo.camera.synchronizer",
      qos: .userInteractive,
      attributes: [],
      autoreleaseFrequency: .inherit,
      target: nil)
    self.outputs = outputs
    let avOutputs = try outputs.map { output in
      guard let hybridOutput = output as? any NativeCameraOutput else {
        throw RuntimeError.error(
          withMessage: "Output \(output) is not of type `NativeCameraOutput`!")
      }
      return hybridOutput.output
    }
    guard avOutputs.count >= 2 else {
      throw RuntimeError.error(
        withMessage: "Cannot create CameraOutputSynchronizer with less than 2 outputs!")
    }
    let allConnected = avOutputs.allSatisfy { !$0.connections.isEmpty }
    guard allConnected else {
      throw RuntimeError.error(
        withMessage:
          "Cannot create CameraOutputSynchronizer when not all of the given outputs are connected to the Camera!"
      )
    }
    self.synchronizer = AVCaptureDataOutputSynchronizer(dataOutputs: avOutputs)
    self.delegate = SynchronizedOutputDelegate()
    super.init()

    // Set delegate
    self.synchronizer.setDelegate(self.delegate, queue: self.queue)
  }

  lazy var thread: any HybridNativeThreadSpec = {
    return HybridNativeThread(queue: queue)
  }()

  func setOnFramesCallback(
    onFrames: (([Variant__any_HybridFrameSpec___any_HybridDepthSpec_]) -> Bool)?
  ) throws {
    if let onFrames {
      delegate.onFrames = { frames in
        let hybrids = frames.map { $0.toJS() }
        _ = onFrames(hybrids)
      }
    } else {
      delegate.onFrames = nil
    }
  }

  func setOnFrameDroppedCallback(onFrameDropped: ((MediaType, FrameDroppedReason) -> Void)?) throws {
    if let onFrameDropped {
      delegate.onFrameDropped = { mediaType, avReason in
        let reason = FrameDroppedReason(reason: avReason)
        onFrameDropped(mediaType, reason)
      }
    } else {
      delegate.onFrameDropped = nil
    }
  }
}

extension SynchronizedDataFrame {
  func toJS() -> Variant__any_HybridFrameSpec___any_HybridDepthSpec_ {
    switch self.data {
    case .video(let buffer):
      let frame = HybridFrame(buffer: buffer, metadata: metadata)
      return .first(frame)
    case .depth(let buffer):
      let depth = HybridDepth(depthData: buffer, metadata: metadata)
      return .second(depth)
    }
  }
}
