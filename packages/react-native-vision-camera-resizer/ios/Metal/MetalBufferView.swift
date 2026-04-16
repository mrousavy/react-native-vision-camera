//
//  MetalBufferView.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.03.26.
//

import Metal

/// Exposes one zero-copy view over the reusable Metal output buffer.
final class MetalBufferView {
  let width: Int
  let height: Int
  let channelOrder: ChannelOrder
  let dataType: DataType
  let pixelLayout: PixelLayout
  let buffer: MTLBuffer

  private let onRelease: () -> Void

  init(
    width: Int,
    height: Int,
    channelOrder: ChannelOrder,
    dataType: DataType,
    pixelLayout: PixelLayout,
    buffer: MTLBuffer,
    onRelease: @escaping () -> Void
  ) {
    self.width = width
    self.height = height
    self.channelOrder = channelOrder
    self.dataType = dataType
    self.pixelLayout = pixelLayout
    self.buffer = buffer
    self.onRelease = onRelease
  }

  deinit {
    onRelease()
  }
}
