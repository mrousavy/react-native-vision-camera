//
//  HybridFrame.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import Foundation
import AVFoundation
import NitroModules
import NitroImage

class HybridFrame: HybridFrameSpec, NativeFrame {
  var sampleBuffer: CMSampleBuffer?
  private var isLocked: Bool
  private var planesCached: [HybridFramePlane]?
  private var pixelBuffer: CVPixelBuffer? {
    guard let sampleBuffer,
          sampleBuffer.isValid else {
      return nil
    }
    return sampleBuffer.imageBuffer
  }

  init(buffer: CMSampleBuffer, orientation: Orientation) {
    self.sampleBuffer = buffer
    self.orientation = orientation
    self.isLocked = false
    self.planesCached = nil
    super.init()
  }

  var memorySize: Int {
    guard let sampleBuffer else {
      return 0
    }
    return sampleBuffer.memorySize
  }

  var timestamp: Double {
    guard let sampleBuffer else {
      return 0
    }
    return sampleBuffer.presentationTimeStamp.seconds
  }

  var width: Double {
    guard let pixelBuffer else {
      return 0
    }
    return Double(CVPixelBufferGetWidth(pixelBuffer))
  }

  var height: Double {
    guard let pixelBuffer else {
      return 0
    }
    return Double(CVPixelBufferGetHeight(pixelBuffer))
  }

  var isValid: Bool {
    return sampleBuffer?.isValid ?? false
  }

  var isPlanar: Bool {
    guard let pixelBuffer else {
      return false
    }
    return CVPixelBufferIsPlanar(pixelBuffer)
  }

  var pixelFormat: PixelFormat {
    guard let pixelBuffer else {
      return .unknown
    }
    let format = CVPixelBufferGetPixelFormatType(pixelBuffer)
    return PixelFormat(osType: format)
  }

  var planesCount: Double {
    guard let pixelBuffer else {
      return 0
    }
    return Double(CVPixelBufferGetPlaneCount(pixelBuffer))
  }

  let orientation: Orientation
  
  /**
   * Manually lock the `CVPixelBuffer` to allow it being accessed from the CPU
   * via the `ArrayBuffer` APIs.
   * The buffer only stays locked as long as the Frame is valid (`isValid`).
   * Once the Frame is invalidated (`dispose()`), the buffer will be unlocked
   * and is no longer safe to access.
   */
  func lockBuffer() throws {
    if isLocked {
      // already locked
      return
    }
    guard let pixelBuffer else {
      throw RuntimeError.error(withMessage: "Cannot lock an already disposed Frame for CPU access!")
    }
    let result = CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
    if result != kCVReturnSuccess {
      throw RuntimeError.error(withMessage: "Failed to lock CVPixelBuffer for CPU access!")
    }
    isLocked = true
  }

  func dispose() {
    if isLocked, let pixelBuffer {
      let result = CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
      if result != kCVReturnSuccess {
        print("Failed to unlock CVPixelBuffer!")
      }
    }
    try? self.sampleBuffer?.invalidate()
    self.sampleBuffer = nil
    self.planesCached?.forEach { $0.dispose() }
  }

  func getPlanes() throws -> [any HybridFramePlaneSpec] {
    guard isValid else {
      throw RuntimeError.error(withMessage: "This Frame has already been disposed!")
    }
    guard let pixelBuffer else {
      throw RuntimeError.error(withMessage: "This Frame does not contain a Pixel Buffer!")
    }
    if let planesCached {
      // we have planes cached
      return planesCached
    }
    try lockBuffer()
    let planeCount = CVPixelBufferGetPlaneCount(pixelBuffer)
    let planes = (0..<planeCount).map { index in
      HybridFramePlane(buffer: pixelBuffer, planeIndex: index)
    }
    self.planesCached = planes
    return planes
  }

  func getPixelBuffer() throws -> ArrayBuffer {
    guard isValid else {
      throw RuntimeError.error(withMessage: "This Frame has already been disposed!")
    }
    guard let pixelBuffer else {
      throw RuntimeError.error(withMessage: "This Frame does not contain a Pixel Buffer!")
    }
    try lockBuffer()
    return try ArrayBuffer.fromPixelBuffer(pixelBuffer)
  }

  func toImage() throws -> any HybridImageSpec {
    guard let sampleBuffer, isValid else {
      throw RuntimeError.error(withMessage: "This Frame has already been disposed!")
    }
    let uiOrientation = orientation.toUIImageOrientation()
    let uiImage = try sampleBuffer.toUIImage(orientation: uiOrientation)
    return HybridUIImage(uiImage: uiImage)
  }

  func toImageAsync() throws -> Promise<any HybridImageSpec> {
    return Promise.async {
      return try self.toImage()
    }
  }
}
