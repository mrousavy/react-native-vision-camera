//
//  MetalReusableBuffer.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.03.26.
//

import Foundation
import Metal
import NitroModules

/// Owns the single reusable Metal output buffer and enforces that only one GPU frame can hold it at a time.
final class MetalReusableBuffer {
  private let stateLock = NSLock()
  private let buffer: MTLBuffer
  private var isInUse = false

  init(device: MTLDevice, bufferLength: Int) throws {
    guard let buffer = device.makeBuffer(length: bufferLength, options: .storageModeShared) else {
      throw RuntimeError.error(withMessage: "Failed to allocate Metal output buffer.")
    }
    buffer.label = "VisionCameraResizer.Output"
    self.buffer = buffer
  }

  /**
   * Returns one live view over the shared output allocation.
   */
  func acquireView(
    width: Int,
    height: Int,
    channelOrder: ChannelOrder,
    dataType: DataType,
    pixelLayout: PixelLayout
  ) throws
    -> MetalBufferView
  {
    stateLock.lock()
    defer { stateLock.unlock() }

    guard !isInUse else {
      throw RuntimeError.error(
        withMessage: "Previous GPUFrame is still in-use. Dispose it before calling resize() again.")
    }

    isInUse = true
    return MetalBufferView(
      width: width,
      height: height,
      channelOrder: channelOrder,
      dataType: dataType,
      pixelLayout: pixelLayout,
      buffer: buffer,
      onRelease: { [self] in releaseView() })
  }

  private func releaseView() {
    stateLock.lock()
    defer { stateLock.unlock() }
    isInUse = false
  }
}
