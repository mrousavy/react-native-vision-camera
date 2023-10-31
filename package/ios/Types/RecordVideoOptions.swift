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
      guard let parsed = try? AVFileType(withString: fileTypeOption) else {
        throw CameraError.parameter(.invalid(unionName: "fileType", receivedValue: fileTypeOption))
      }
      fileType = parsed
    }
    // Flash
    if let flashOption = dictionary["flash"] as? String {
      guard let parsed = try? Torch(jsValue: flashOption) else {
        throw CameraError.parameter(.invalid(unionName: "flash", receivedValue: flashOption))
      }
      flash = parsed
    }
    // Codec
    if let codecOption = dictionary["codec"] as? String {
      guard let parsed = try? AVVideoCodecType(withString: codecOption) else {
        throw CameraError.parameter(.invalid(unionName: "codec", receivedValue: codecOption))
      }
      codec = parsed
    }
    // BitRate
    if let parsed = dictionary["bitRate"] as? Double {
      bitRate = parsed
    }
  }
}
