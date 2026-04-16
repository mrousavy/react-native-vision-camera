//
//  HybridGPUFrame.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import NitroModules

/// JS-facing wrapper around one live Metal output-buffer view, zero-copy.
final class HybridGPUFrame: HybridGPUFrameSpec {
  private var outputBufferView: MetalBufferView?

  init(outputBufferView: MetalBufferView) {
    self.outputBufferView = outputBufferView
    super.init()
  }

  var width: Double {
    guard let outputBufferView else {
      return 0.0
    }
    return Double(outputBufferView.width)
  }

  var height: Double {
    guard let outputBufferView else {
      return 0.0
    }
    return Double(outputBufferView.height)
  }

  var channelOrder: ChannelOrder? {
    return outputBufferView?.channelOrder
  }

  var dataType: DataType? {
    return outputBufferView?.dataType
  }

  var pixelLayout: PixelLayout? {
    return outputBufferView?.pixelLayout
  }

  var memorySize: Int {
    return outputBufferView?.buffer.length ?? 0
  }

  func dispose() {
    outputBufferView = nil
  }

  func getPixelBuffer() throws -> ArrayBuffer {
    guard let outputBufferView else {
      throw RuntimeError.error(withMessage: "This GPUFrame has already been disposed!")
    }
    let pointer = outputBufferView.buffer.contents()
    let size = outputBufferView.buffer.length

    return ArrayBuffer.wrap(
      dataWithoutCopy: pointer,
      size: size,
      onDelete: {
        // The HybridGPUFrame decides how long this zero-copy view stays valid.
      }
    )
  }
}
