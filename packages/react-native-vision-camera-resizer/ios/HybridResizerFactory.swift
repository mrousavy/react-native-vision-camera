//
//  HybridResizerFactory.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import AVFoundation
import Metal
import NitroModules

class HybridResizerFactory: HybridResizerFactorySpec {
  func isAvailable() -> Bool {
    return MTLCreateSystemDefaultDevice() != nil
  }

  func createResizer(options: ResizerOptions) throws -> Promise<any HybridResizerSpec> {
    return Promise.async {
      // Initialize Metal resizer pipeline asynchronously
      return try HybridResizer(options: options)
    }
  }
}
