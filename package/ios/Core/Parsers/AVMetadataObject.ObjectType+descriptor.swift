//
//  AVMetadataObject.ObjectType+descriptor.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension AVMetadataObject.ObjectType {
  public static func parse(string: String) throws -> Self? {
    switch string {
    case "code-128":
      return .code128
    case "code-39":
      return .code39
    case "code-93":
      return .code93
    case "codabar":
      if #available(iOS 15.4, *) {
        return .codabar
      } else {
        return nil
      }
    case "ean-13":
      return .ean13
    case "ean-8":
      return .ean8
    case "itf":
      return .itf14
    case "upc-e":
      return .upce
    case "upc-a":
      return .ean13
    case "qr":
      return .qr
    case "pdf-417":
      return .pdf417
    case "aztec":
      return .aztec
    case "data-matrix":
      return .dataMatrix
    default:
      throw EnumParserError.invalidValue
    }
  }

  var descriptor: String {
    if #available(iOS 15.4, *) {
      if self == .codabar {
        return "codabar"
      }
    }

    switch self {
    case .code128:
      return "code-128"
    case .code39:
      return "code-39"
    case .code93:
      return "code-93"
    case .ean13:
      return "ean-13"
    case .ean8:
      return "ean-8"
    case .itf14:
      return "itf"
    case .upce:
      return "upce"
    case .qr:
      return "qr"
    case .pdf417:
      return "pdf-417"
    case .aztec:
      return "aztec"
    case .dataMatrix:
      return "data-matrix"
    default:
      return "unknown"
    }
  }
}
