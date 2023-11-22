//
//  AVCaptureVideoDataOutput+recommendedVideoSettings.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 22.11.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension AVCaptureVideoDataOutput {
  /**
   Get the recommended options for an [AVAssetWriter] with the desired [RecordVideoOptions].
   */
  func recommendedVideoSettings(forOptions options: RecordVideoOptions) throws -> [String: Any] {
    let settings: [String: Any]?
    if let videoCodec = options.codec {
      settings = recommendedVideoSettings(forVideoCodecType: videoCodec, assetWriterOutputFileType: options.fileType)
    } else {
      settings = recommendedVideoSettingsForAssetWriter(writingTo: options.fileType)
    }
    guard var settings else {
      throw CameraError.capture(.createRecorderError(message: "Failed to get video settings!"))
    }

    if let bitRate = options.bitRate {
      // Convert from Mbps -> bps
      let bitsPerSecond = bitRate * 1_000_000
      settings[AVVideoCompressionPropertiesKey] = [
        AVVideoAverageBitRateKey: NSNumber(value: bitsPerSecond),
      ]
    }

    return settings
  }
}
