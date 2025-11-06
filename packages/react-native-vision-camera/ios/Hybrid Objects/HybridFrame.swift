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

class HybridFrame: HybridFrameSpec {
  var sampleBuffer: CMSampleBuffer?
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

  func dispose() {
    try? self.sampleBuffer?.invalidate()
    self.sampleBuffer = nil
  }

  func getPlanes() throws -> [any HybridFramePlaneSpec] {
    guard isValid else {
      throw RuntimeError.error(withMessage: "This Frame has already been disposed!")
    }
    guard let pixelBuffer else {
      throw RuntimeError.error(withMessage: "This Frame does not contain a Pixel Buffer!")
    }
    let planeCount = CVPixelBufferGetPlaneCount(pixelBuffer)
    return (0..<planeCount).map { index in
      HybridFramePlane(buffer: pixelBuffer, planeIndex: index)
    }
  }

  func getPixelBuffer() throws -> ArrayBuffer {
    guard isValid else {
      throw RuntimeError.error(withMessage: "This Frame has already been disposed!")
    }
    guard let pixelBuffer else {
      throw RuntimeError.error(withMessage: "This Frame does not contain a Pixel Buffer!")
    }
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
