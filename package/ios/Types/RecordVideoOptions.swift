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
  /**
   Bit-Rate of the Video, in Megabits per second (Mbps)
   */
  var bitRate: Double?

  init(fromJSValue dictionary: NSDictionary) throws {
    // File Type (.mov or .mp4)
    if let fileTypeOption = dictionary["fileType"] as? String {
      fileType = try AVFileType(withString: fileTypeOption)
    }
    // Flash
    if let flashOption = dictionary["flash"] as? String {
      flash = try Torch(jsValue: flashOption)
    }
    // Codec
    if let codecOption = dictionary["codec"] as? String {
      codec = try AVVideoCodecType(withString: codecOption)
    }
    // BitRate
    if let parsed = dictionary["bitRate"] as? Double {
      bitRate = parsed
    }
  }
}
