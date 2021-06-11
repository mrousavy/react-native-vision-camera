//
//  AVAssetWriterInputPixelBufferAdaptor+initWithVideoSettings.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.05.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension AVAssetWriterInputPixelBufferAdaptor {
  /**
   Convenience initializer to extract correct attributes from the given videoSettings.
   */
  convenience init(assetWriterInput: AVAssetWriterInput,
                   withVideoSettings videoSettings: [String: Any],
                   pixelFormat: OSType) {
    var attributes: [String: Any] = [:]

    if let width = videoSettings[AVVideoWidthKey] as? NSNumber,
       let height = videoSettings[AVVideoHeightKey] as? NSNumber {
      attributes[kCVPixelBufferWidthKey as String] = width as CFNumber
      attributes[kCVPixelBufferHeightKey as String] = height as CFNumber
    }

    attributes[kCVPixelBufferPixelFormatTypeKey as String] = pixelFormat

    self.init(assetWriterInput: assetWriterInput, sourcePixelBufferAttributes: attributes)
  }
}
