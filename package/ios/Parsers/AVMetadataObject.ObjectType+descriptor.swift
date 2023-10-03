//
//  AVMetadataObject.ObjectType+descriptor.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import Foundation
import AVFoundation

extension AVMetadataObject.ObjectType {
  init(withString string: String) throws {
    switch string {
    case "qr":
      self = .qr
      return
    case "aztec":
      self = .aztec
      return
    case "ean-13":
      self = .ean13
      return
      // TODO: Add other types here
    default:
      throw EnumParserError.invalidValue
    }
  }
  
  var descriptor: String {
    switch self {
    case .qr:
      return "qr"
    case .aztec:
      return "aztec"
    case .ean13:
      return "ean-13"
      // TODO: Add other types here
    default:
      fatalError("Unknown AVMetadataObject.ObjectType value! \(rawValue)")
    }
  }
}
