///
/// HybridCameraFrameOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraFrameOutput: HybridCameraFrameOutputSpec, NativeCameraOutput {
  private let videoOutput: AVCaptureVideoDataOutput
  private let delegate: FrameDelegate
  private let queue: DispatchQueue
  let outputType: CameraOutputType = .stream
  let mediaType: MediaType = .video
  var output: AVCaptureOutput {
    return videoOutput
  }

  init(targetPixelFormat: TargetVideoPixelFormat) {
    self.videoOutput = AVCaptureVideoDataOutput()
    self.delegate = FrameDelegate()
    self.queue = DispatchQueue(label: "com.margelo.camera.frame",
                               qos: .userInteractive,
                               attributes: [],
                               autoreleaseFrequency: .inherit,
                               target: nil)
    super.init()

    // Set up our `delegate`
    videoOutput.setSampleBufferDelegate(delegate, queue: queue)
    // Configure `videoSettings`
    videoOutput.videoSettings = videoSettingsForPixelFormat(targetPixelFormat)
    // If the pipeline stalls, drop frames to avoid blowing up RAM
    videoOutput.alwaysDiscardsLateVideoFrames = true
    // JS configures the video resolution, we don't want to downscale here.
    videoOutput.automaticallyConfiguresOutputBufferDimensions = false
    if #available(iOS 26.0, *) {
      // Don't process HDR metadata - keep it native.
      videoOutput.preservesDynamicHDRMetadata = true
    }
  }

  private func videoSettingsForPixelFormat(_ targetPixelFormat: TargetVideoPixelFormat) -> [String: Any] {
    let pixelFormat = targetPixelFormat.toCVPixelFormatType()
    if case let .specific(format) = pixelFormat {
      // Use a specific format (e.g. 32 BGRA)
      return [
        kCVPixelBufferPixelFormatTypeKey as String: format
      ]
    } else {
      // Empty dictionary means "choose device-native format" (most efficient)
      return [:]
    }
  }

  var thread: any HybridNativeThreadSpec {
    return HybridNativeThread(queue: queue)
  }

  func setOnFrameCallback(onFrame: ((any HybridFrameSpec) -> Bool)?) throws {
    if let onFrame {
      delegate.onFrame = { (sampleBuffer, orientation) in
        let frame = HybridFrame(buffer: sampleBuffer,
                                orientation: orientation)
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
