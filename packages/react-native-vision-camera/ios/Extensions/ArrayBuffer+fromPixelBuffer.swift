///
/// ArrayBuffer+fromPixelBuffer.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension ArrayBuffer {
  static func fromPixelBuffer(_ pixelBuffer: CVPixelBuffer) throws -> ArrayBuffer {
    let result = CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
    if (result != kCVReturnSuccess) {
      throw RuntimeError.error(withMessage: "Failed to lock CVPixelBuffer for read!")
    }
    guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else {
      throw RuntimeError.error(withMessage: "Failed to get CVPixelBuffer's base address!")
    }
    let size = CVPixelBufferGetDataSize(pixelBuffer)
    return ArrayBuffer.wrap(dataWithoutCopy: baseAddress,
                            size: size,
                            onDelete: {
      let result = CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
      if (result != kCVReturnSuccess) {
        print("Failed to unlock CVPixelBuffer to cleanup after ArrayBuffer!")
      }
    })
  }
}
