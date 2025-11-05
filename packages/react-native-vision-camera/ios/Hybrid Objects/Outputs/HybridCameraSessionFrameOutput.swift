///
/// HybridCameraSessionFrameOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation
import NitroImage

private class FrameDelegate: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
  var onFrame: ((CMSampleBuffer) -> Void)?
  var onFrameDropped: ((CMSampleBuffer) -> Void)?
  
  func captureOutput(_ output: AVCaptureOutput, didDrop sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    if let onFrameDropped {
      onFrameDropped(sampleBuffer)
    }
  }
  
  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    if let onFrame {
      onFrame(sampleBuffer)
    }
  }
}

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
  }
  
  var thread: any HybridNativeThreadSpec {
    return HybridNativeThread(queue: queue)
  }
  
  func setOnFrameCallback(onFrame: ((any HybridFrameSpec) -> Bool)?) throws {
    if let onFrame {
      delegate.onFrame = { sampleBuffer in
        let frame = HybridFrame(buffer: sampleBuffer)
        onFrame(frame)
      }
    } else {
      delegate.onFrame = nil
    }
  }
  
  func setOnFrameDroppedCallback(onFrameDropped: ((FrameDroppedReason) -> Void)?) throws {
    if let onFrameDropped {
      delegate.onFrameDropped = { sampleBuffer in
        guard let attachment = sampleBuffer.attachments[.droppedFrameReason],
              let reason = attachment.value as? String else { return }
        switch reason as CFString {
        case kCMSampleBufferDroppedFrameReason_FrameWasLate:
          onFrameDropped(.frameWasLate)
        case kCMSampleBufferDroppedFrameReason_OutOfBuffers:
          onFrameDropped(.outOfBuffers)
        case kCMSampleBufferDroppedFrameReason_Discontinuity:
          onFrameDropped(.discontinuity)
        default:
          onFrameDropped(.unknown)
        }
      }
    } else {
      delegate.onFrameDropped = nil
    }
  }
}
