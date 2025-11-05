///
/// HybridCameraSessionFrameOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraSessionFrameOutput: HybridCameraSessionFrameOutputSpec, CameraSessionOutput {
  private let videoOutput: AVCaptureVideoDataOutput
  private let delegate: FrameDelegate
  private let queue: DispatchQueue
  let type: CameraSessionOutputType = .stream
  var output: AVCaptureOutput {
    return videoOutput
  }
  
  override init() {
    self.videoOutput = AVCaptureVideoDataOutput()
    self.delegate = FrameDelegate()
    self.queue = DispatchQueue(label: "com.margelo.camera.frame",
                               qos: .userInteractive,
                               attributes: [],
                               autoreleaseFrequency: .inherit,
                               target: nil)
    videoOutput.setSampleBufferDelegate(delegate, queue: queue)
    videoOutput.alwaysDiscardsLateVideoFrames = true
  }
  
  var thread: any HybridNativeThreadSpec {
    return HybridNativeThread(queue: queue)
  }
  
  func setOnFrameCallback(onFrame: ((any HybridFrameSpec) -> Bool)?) throws {
    if let onFrame {
      delegate.onFrame = { sampleBuffer in
        let frame = HybridFrame(buffer: sampleBuffer)
        _ = onFrame(frame)
      }
    } else {
      delegate.onFrame = nil
    }
  }
  
  func setOnFrameDroppedCallback(onFrameDropped: ((FrameDroppedReason) -> Void)?) throws {
    if let onFrameDropped {
      delegate.onFrameDropped = { sampleBuffer in
        guard let attachment = sampleBuffer.attachments[.droppedFrameReason] else {
          return
        }
        let reason = FrameDroppedReason(sampleBufferReason: attachment)
        onFrameDropped(reason)
      }
    } else {
      delegate.onFrameDropped = nil
    }
  }
}
