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
   * The given `CVPixelBuffer` has to be already locked, otherwise this method fails.
   */
  static func fromPixelBuffer(_ pixelBuffer: CVPixelBuffer) throws -> ArrayBuffer {
    guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else {
      throw RuntimeError.error(withMessage: "Failed to get CVPixelBuffer's base address!")
    }
    let size = CVPixelBufferGetDataSize(pixelBuffer)
    return ArrayBuffer.wrap(dataWithoutCopy: baseAddress,
                            size: size,
                            onDelete: {
      // On delete, we do nothing. We rely on the parent Frame
      // to invalidate (and unlock) the pixel buffer.
    })
  }
  
  /**
   * Converts the plane at the given index of a **planar** `CVPixelBuffer` to an `ArrayBuffer`.
   */
  static func fromPixelBuffer(_ pixelBuffer: CVPixelBuffer, planeIndex: Int) throws -> ArrayBuffer {
    guard CVPixelBufferIsPlanar(pixelBuffer) else {
      throw RuntimeError.error(withMessage: "Cannot convert plane #\(planeIndex) of a non-planar CVPixelBuffer to an ArrayBuffer! Use the non-planar variant.")
    }
    let planeCount = CVPixelBufferGetPlaneCount(pixelBuffer)
    guard planeCount > planeIndex || planeIndex < 0 else {
      throw RuntimeError.error(withMessage: "Cannot convert plane #\(planeIndex) of a CVPixelBuffer with only \(planeCount) planes to an ArrayBuffer - it's out of range!")
    }
    
    guard let baseAddress = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, planeIndex) else {
      throw RuntimeError.error(withMessage: "Failed to get CVPixelBuffer's base address!")
    }
    let size = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, planeIndex) * CVPixelBufferGetHeightOfPlane(pixelBuffer, planeIndex)
    return ArrayBuffer.wrap(dataWithoutCopy: baseAddress,
                            size: size,
                            onDelete: {
      // On delete, we do nothing. We rely on the parent Frame
      // to invalidate (and unlock) the pixel buffer.
    })
  }
}
