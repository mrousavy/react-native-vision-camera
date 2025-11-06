///
/// ArrayBuffer+fromPixelBuffer.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension ArrayBuffer {
  /**
   * Converts a **non-planar** `CVPixelBuffer` to an `ArrayBuffer`.
   */
  static func fromPixelBuffer(_ pixelBuffer: CVPixelBuffer) throws -> ArrayBuffer {
    // 1. Preconditions
    guard !CVPixelBufferIsPlanar(pixelBuffer) else {
      throw RuntimeError.error(withMessage: "Cannot convert a planar CVPixelBuffer to a single ArrayBuffer! Use the planar variant.")
    }
    
    // 2. Lock the base address of the buffer so we can access it on the CPU
    let result = CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
    if (result != kCVReturnSuccess) {
      throw RuntimeError.error(withMessage: "Failed to lock CVPixelBuffer for read!")
    }
    // 3. Get the actual `void*` base address
    guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else {
      CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
      throw RuntimeError.error(withMessage: "Failed to get CVPixelBuffer's base address!")
    }
    // 4. Total size of the ArrayBuffer is stored in CVPixelBuffer
    let size = CVPixelBufferGetDataSize(pixelBuffer)
    // 5. Wrap it in an `ArrayBuffer` - no copy.
    return ArrayBuffer.wrap(dataWithoutCopy: baseAddress,
                            size: size,
                            onDelete: {
      // 6. On delete, unlock the base address again so it can be freed.
      let result = CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
      if (result != kCVReturnSuccess) {
        print("Failed to unlock CVPixelBuffer to cleanup after ArrayBuffer!")
      }
    })
  }
  
  /**
   * Converts the plane at the given index of a **planar** `CVPixelBuffer` to an `ArrayBuffer`.
   */
  static func fromPixelBuffer(_ pixelBuffer: CVPixelBuffer, planeIndex: Int) throws -> ArrayBuffer {
    // 1. Preconditions
    guard CVPixelBufferIsPlanar(pixelBuffer) else {
      throw RuntimeError.error(withMessage: "Cannot convert plane #\(planeIndex) of a non-planar CVPixelBuffer to an ArrayBuffer! Use the non-planar variant.")
    }
    let planeCount = CVPixelBufferGetPlaneCount(pixelBuffer)
    guard planeCount > planeIndex || planeIndex < 0 else {
      throw RuntimeError.error(withMessage: "Cannot convert plane #\(planeIndex) of a CVPixelBuffer with only \(planeCount) planes to an ArrayBuffer - it's out of range!")
    }
    
    // 2. Lock the base address of the buffer so we can access it on the CPU
    let result = CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
    if (result != kCVReturnSuccess) {
      throw RuntimeError.error(withMessage: "Failed to lock CVPixelBuffer for read!")
    }
    // 3. Get the actual `void*` base address
    guard let baseAddress = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, planeIndex) else {
      CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
      throw RuntimeError.error(withMessage: "Failed to get CVPixelBuffer's base address!")
    }
    // 4. Compute the total size of the buffer for this plane
    let size = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, planeIndex) * CVPixelBufferGetHeightOfPlane(pixelBuffer, planeIndex)
    // 5. Wrap it in an `ArrayBuffer` - no copy.
    return ArrayBuffer.wrap(dataWithoutCopy: baseAddress,
                            size: size,
                            onDelete: {
      // 6. On delete, unlock the base address again so it can be freed.
      let result = CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
      if (result != kCVReturnSuccess) {
        print("Failed to unlock CVPixelBuffer to cleanup after ArrayBuffer!")
      }
    })
  }
}
