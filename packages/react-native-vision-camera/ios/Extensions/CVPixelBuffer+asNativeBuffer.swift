//
//  CVPixelBuffer+asNativeBuffer.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.02.26.
//

import AVFoundation
import CoreVideo

extension UInt64 {
  fileprivate init(fromPointerAddress pointer: UnsafeMutableRawPointer) {
    let uint = UInt(bitPattern: pointer)
    self.init(uint)
  }
}

extension CVPixelBuffer {
  func asNativeBuffer() -> NativeBuffer {
    let rawPointer =
      Unmanaged
      .passRetained(self)
      .toOpaque()  // +1 retain
    let pointer = UInt64(fromPointerAddress: rawPointer)
    var wasReleased = false
    let release = {
      assert(!wasReleased, "Tried to release NativeBuffer twice!")
      Unmanaged<CVPixelBuffer>
        .fromOpaque(rawPointer)
        .release()  // -1 retain
      wasReleased = true
    }
    return NativeBuffer(
      pointer: pointer,
      release: release)
  }
}
