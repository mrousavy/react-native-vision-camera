///
/// HybridCameraSessionDepthFrameOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

func depthToSampleBuffer(_ depth: AVDepthData,
                         pts: CMTime,
                         duration: CMTime = .invalid) -> CMSampleBuffer {
  // 1) Normalize type to something standard
  let normalized = depth.converting(toDepthDataType: kCVPixelFormatType_DepthFloat32)
  let pb: CVPixelBuffer = normalized.depthDataMap

  // 3) Build a format description from the pixel buffer
  var fmt: CMVideoFormatDescription?
  CMVideoFormatDescriptionCreateForImageBuffer(allocator: kCFAllocatorDefault,
                                                   imageBuffer: pb,
                                                   formatDescriptionOut: &fmt)

  // 4) Timestamping
  var timing = CMSampleTimingInfo(duration: duration,
                                  presentationTimeStamp: pts,
                                  decodeTimeStamp: .invalid)

  // 5) Create a ready sample buffer
  var sbuf: CMSampleBuffer?
  CMSampleBufferCreateReadyWithImageBuffer(allocator: kCFAllocatorDefault,
                                               imageBuffer: pb,
                                               formatDescription: fmt!,
                                               sampleTiming: &timing,
                                               sampleBufferOut: &sbuf)
  return sbuf!
}

class HybridCameraSessionDepthFrameOutput: HybridCameraSessionFrameOutputSpec, CameraSessionOutput {
  private let depthOutput: AVCaptureDepthDataOutput
  private let delegate: DepthFrameDelegate
  private let queue: DispatchQueue
  let type: CameraSessionOutputType = .stream
  var output: AVCaptureOutput {
    return depthOutput
  }

  override init() {
    self.depthOutput = AVCaptureDepthDataOutput()
    self.delegate = DepthFrameDelegate()
    self.queue = DispatchQueue(label: "com.margelo.camera.depth-frame",
                               qos: .userInteractive,
                               attributes: [],
                               autoreleaseFrequency: .inherit,
                               target: nil)
    super.init()

    // Set up our `delegate`
    depthOutput.setDelegate(delegate, callbackQueue: queue)
    // If the pipeline stalls, drop frames to avoid blowing up RAM
    depthOutput.alwaysDiscardsLateDepthData = true
  }

  var thread: any HybridNativeThreadSpec {
    return HybridNativeThread(queue: queue)
  }

  func setOnFrameCallback(onFrame: ((any HybridFrameSpec) -> Bool)?) throws {
    if let onFrame {
      delegate.onFrame = { (depthData, timestamp, orientation) in
        let sample = depthToSampleBuffer(depthData, pts: timestamp)
        let frame = HybridFrame(buffer: sample, orientation: orientation)
        _ = onFrame(frame)
        print("Received depth: \(depthData)")
      }
    } else {
      delegate.onFrame = nil
    }
  }

  func setOnFrameDroppedCallback(onFrameDropped: ((FrameDroppedReason) -> Void)?) throws {
    if let onFrameDropped {
      delegate.onFrameDropped = { reason in
        onFrameDropped(.unknown)
        print("Depth frame dropped \(reason)")
      }
    } else {
      delegate.onFrameDropped = nil
    }
  }
}
