//
//  RecordVideoOptions.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 12.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import Foundation
import AVFoundation

struct RecordVideoOptions {
  var fileType: AVFileType = .mov
  var flash: Torch = .off
  var codec: AVVideoCodecType? = nil
  /**
   Bit-Rate of the Video, in Megabits per second (Mbps)
   */
  var bitRate: Double? = nil
  
  
  init(fromJSValue dictionary: NSDictionary) throws {
    // File Type (.mov or .mp4)
    if let fileTypeOption = dictionary["fileType"] as? String {
      guard let parsed = try? AVFileType(withString: fileTypeOption) else {
        throw CameraError.parameter(.invalid(unionName: "fileType", receivedValue: fileTypeOption))
      }
      fileType = parsed
    }
  }
}
