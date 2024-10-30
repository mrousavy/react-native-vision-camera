//
//  RecordVideoOptions.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 12.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

struct RecordVideoOptions {
  var fileType: AVFileType = .mov
  var flash: Torch = .off
  var codec: AVVideoCodecType?
  var path: URL
  /**
   * Full Bit-Rate override for the Video Encoder, in Megabits per second (Mbps)
   */
  var bitRateOverride: Double?
  /**
   * A multiplier applied to whatever the currently set bit-rate is, whether it's automatically computed by the OS Encoder,
   * or set via bitRate, in Megabits per second (Mbps)
   */
  var bitRateMultiplier: Double?

  init(fromJSValue dictionary: NSDictionary, bitRateOverride: Double? = nil, bitRateMultiplier: Double? = nil) throws {
    // File Type (.mov or .mp4)
    if let fileTypeOption = dictionary["fileType"] as? String {
      fileType = try AVFileType(withString: fileTypeOption)
    }
    // Flash
    if let flashOption = dictionary["flash"] as? String {
      flash = try Torch(jsValue: flashOption)
    }
    // Codec
    if let codecOption = dictionary["videoCodec"] as? String {
      codec = try AVVideoCodecType(withString: codecOption)
    }
    // BitRate Override
    self.bitRateOverride = bitRateOverride
    // BitRate Multiplier
    self.bitRateMultiplier = bitRateMultiplier
    // Custom Path
    let fileExtension = fileType.descriptor ?? "mov"
    if let customPath = dictionary["path"] as? String {
      path = try FileUtils.getFilePath(customDirectory: customPath, fileExtension: fileExtension)
    } else {
      path = try FileUtils.getFilePath(fileExtension: fileExtension)
    }
  }
}
