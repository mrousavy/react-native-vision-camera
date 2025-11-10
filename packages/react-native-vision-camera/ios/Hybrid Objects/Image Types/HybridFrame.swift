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

class HybridFrame: HybridFrameSpec, NativeFrame, LazyLockableBuffer {
  var sampleBuffer: CMSampleBuffer?
  let metadata: MediaSampleMetadata
  var isLocked: Bool = false
  private var planesCached: [HybridFramePlane]?
  var pixelBuffer: CVPixelBuffer? {
    return sampleBuffer?.imageBuffer
  }

  init(buffer: CMSampleBuffer,
       metadata: MediaSampleMetadata) {
    self.sampleBuffer = buffer
    self.metadata = metadata
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
    return metadata.timestamp.seconds
  }
  var isMirrored: Bool {
    return metadata.isMirrored
  }
  var orientation: Orientation {
    return metadata.orientation
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
    let osType = CVPixelBufferGetPixelFormatType(pixelBuffer)
    return PixelFormat(osType: osType)
  }

  var planesCount: Double {
    guard let pixelBuffer else {
      return 0
    }
    return Double(CVPixelBufferGetPlaneCount(pixelBuffer))
  }

  func dispose() {
    self.unlockBuffer()
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
    try ensureBufferLocked()
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
    try ensureBufferLocked()
    return try ArrayBuffer.fromPixelBuffer(pixelBuffer)
  }

  func toImage() throws -> any HybridImageSpec {
    guard let sampleBuffer, isValid else {
      throw RuntimeError.error(withMessage: "This Frame has already been disposed!")
    }
    let uiOrientation = metadata.uiImageOrientation
    let uiImage = try sampleBuffer.toUIImage(orientation: uiOrientation)
    return HybridUIImage(uiImage: uiImage)
  }

  func toImageAsync() throws -> Promise<any HybridImageSpec> {
    return Promise.async {
      return try self.toImage()
    }
  }
}
