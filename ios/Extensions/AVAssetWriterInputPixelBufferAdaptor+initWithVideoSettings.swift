//
//  AVAssetWriterInputPixelBufferAdaptor+initWithVideoSettings.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.05.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import AVFoundation
import Foundation

extension AVAssetWriterInputPixelBufferAdaptor {
  /**
   Convenience initializer to extract correct attributes from the given videoSettings.
   */
  convenience init(assetWriterInput: AVAssetWriterInput, withVideoSettings videoSettings: [String: Any]) {
    var attributes: [String: Any] = [:]

    if let width = videoSettings[AVVideoWidthKey] as? NSNumber,
       let height = videoSettings[AVVideoHeightKey] as? NSNumber {
      attributes[kCVPixelBufferWidthKey as String] = width as CFNumber
      attributes[kCVPixelBufferHeightKey as String] = height as CFNumber
    }

    // TODO: Is "Bi-Planar Y'CbCr 8-bit 4:2:0 full-range" the best CVPixelFormatType? How can I find natively supported ones?
    attributes[kCVPixelBufferPixelFormatTypeKey as String] = kCVPixelFormatType_420YpCbCr8BiPlanarFullRange

    self.init(assetWriterInput: assetWriterInput, sourcePixelBufferAttributes: attributes)
  }
}
