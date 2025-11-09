//
//  MediaSampleMetadata.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import Foundation
import AVFoundation
import NitroModules
import UIKit

protocol LazyLockableBuffer: AnyObject {
  var isLocked: Bool { get set }
  var pixelBuffer: CVPixelBuffer? { get }
  
  func ensureBufferLocked() throws
  func unlockBuffer()
}

extension LazyLockableBuffer {
  func ensureBufferLocked() throws {
    if isLocked {
      return
    }
    guard let pixelBuffer else {
      throw RuntimeError.error(withMessage: "Failed to lock already disposed PixelBuffer!")
    }
    let result = CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
    guard result == kCVReturnSuccess else {
      throw RuntimeError.error(withMessage: "Failed to lock PixelBuffer \(pixelBuffer)!")
    }
    self.isLocked = true
  }
  
  func unlockBuffer() {
    if isLocked {
      guard let pixelBuffer else {
        return
      }
      let result = CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
      if result != kCVReturnSuccess {
        print("Failed to unlock PixelBuffer \(pixelBuffer)!")
      }
    }
  }
}
