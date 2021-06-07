//
//  AVFileType+descriptor.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 01.05.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension AVFileType {
  init(withString string: String) throws {
    switch string {
    case "mov":
      self = .mov
    case "mp4":
      self = .mp4
    default:
      throw EnumParserError.invalidValue
    }
  }

  var descriptor: String? {
    switch self {
    case .mov:
      return "mov"
    case .mp4:
      return "mp4"
    default:
      return nil
    }
  }
}
