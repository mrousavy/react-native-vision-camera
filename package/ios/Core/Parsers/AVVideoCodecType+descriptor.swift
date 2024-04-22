//
//  AVVideoCodecType+descriptor.swift
//  mrousavy
//
//  Created by Marc Rousavy on 15.12.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension AVVideoCodecType {
  init(withString string: String) throws {
    switch string {
    case "h264":
      self = .h264
      return
    case "h265":
      self = .hevc
      return
    default:
      throw CameraError.parameter(.invalid(unionName: "videoCodec", receivedValue: string))
    }
  }
}
