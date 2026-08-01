//
//  HybridResizer.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import AVFoundation
import CoreVideo
import NitroModules
import VisionCamera

/// High-level iOS resizer that turns camera frames into GPU-backed JS-visible output frames.
final class HybridResizer: HybridResizerSpec {
  /// Serializes `resize()` against `dispose()` - the same lifecycle guard as the Android
  /// `HybridResizer`'s `_lifecycleMutex`.
  ///
  /// `pipeline` is read on the Frame Processor Thread (`resize`, and `memorySize` via Nitro's
  /// `toObject`) while `dispose()` can clear it from JS. A Swift stored-property load/store of a
  /// class reference is not atomic, so an unguarded `pipeline = nil` racing the `guard let` load is
  /// a data race on the possibly-last reference. Holding the lock across `run()` also means a
  /// dispose landing mid-Frame waits for that resize to return, and every later call throws the
  /// catchable "already been disposed" error instead.
  ///
  /// A `GPUFrame` that is still checked out is unaffected: its `MetalBufferView`'s `onRelease`
  /// closure strongly captures the `MetalReusableBuffer`, so ARC keeps the output buffer alive
  /// independently of the pipeline.
  private let lifecycleLock = NSLock()
  private var pipeline: MetalResizerPipeline?

  init(options: ResizerOptions) throws {
    self.pipeline = try MetalResizerPipeline(options: options)
    super.init()
  }

  var memorySize: Int {
    lifecycleLock.lock()
    defer { lifecycleLock.unlock() }
    return pipeline?.outputByteCount ?? 0
  }

  func dispose() {
    lifecycleLock.lock()
    defer { lifecycleLock.unlock() }
    pipeline = nil
  }

  func resize(frame: any HybridFrameSpec) throws -> any HybridGPUFrameSpec {
    lifecycleLock.lock()
    defer { lifecycleLock.unlock() }
    guard let pipeline else {
      throw RuntimeError.error(withMessage: "This Resizer has already been disposed!")
    }
    let sampleBuffer = try sampleBuffer(from: frame)
    let pixelBuffer = try pixelBuffer(from: sampleBuffer)
    let rotationDegrees = frame.orientation.shaderRotationDegrees
    let isMirrored = frame.isMirrored
    let outputBufferView = try pipeline.run(
      pixelBuffer: pixelBuffer,
      rotationDegrees: rotationDegrees,
      isMirrored: isMirrored)

    return HybridGPUFrame(outputBufferView: outputBufferView)
  }

  private func sampleBuffer(from frame: any HybridFrameSpec) throws -> CMSampleBuffer {
    guard let nativeFrame = frame as? any NativeFrame else {
      throw RuntimeError.error(withMessage: "The given Frame is not of type `NativeFrame`!")
    }
    guard let sampleBuffer = nativeFrame.sampleBuffer else {
      throw RuntimeError.error(withMessage: "The given Frame's `sampleBuffer` is no longer valid!")
    }
    return sampleBuffer
  }

  private func pixelBuffer(from sampleBuffer: CMSampleBuffer) throws -> CVPixelBuffer {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
      throw RuntimeError.error(
        withMessage: "The given Frame does not contain a valid image buffer!")
    }
    return pixelBuffer
  }
}
