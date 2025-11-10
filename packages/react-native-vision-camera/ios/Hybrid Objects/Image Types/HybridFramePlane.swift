//
//  HybridFramePlane.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import Foundation
import AVFoundation
import NitroModules
import NitroImage

class HybridFramePlane: HybridFramePlaneSpec {
  var pixelBuffer: CVPixelBuffer?
  let planeIndex: Int

  init(buffer: CVPixelBuffer, planeIndex: Int) {
    self.pixelBuffer = buffer
    self.planeIndex = planeIndex
    super.init()
  }

  var memorySize: Int {
    return pixelBuffer?.memorySize(ofPlaneIndex: planeIndex) ?? 0
  }

  var width: Double {
    guard let pixelBuffer else {
      return 0
    }
    return Double(CVPixelBufferGetWidthOfPlane(pixelBuffer, planeIndex))
  }

  var height: Double {
    guard let pixelBuffer else {
      return 0
    }
    return Double(CVPixelBufferGetHeightOfPlane(pixelBuffer, planeIndex))
  }

  var isValid: Bool {
    return pixelBuffer != nil
  }

  func dispose() {
    self.pixelBuffer = nil
  }

  func getPixelBuffer() throws -> ArrayBuffer {
    guard let pixelBuffer else {
      throw RuntimeError.error(withMessage: "This FramePlane has already been disposed!")
    }
    return try ArrayBuffer.fromPixelBuffer(pixelBuffer, planeIndex: planeIndex)
  }
}
