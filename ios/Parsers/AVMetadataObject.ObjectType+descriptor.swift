//
//  AVMetadataObject.ObjectType+descriptor.swift
//  Cuvent
//
//  Created by Marc Rousavy on 16.12.20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import AVFoundation
import Foundation

extension AVMetadataObject.ObjectType {
  init(withString string: String) throws {
    switch string {
    case "aztec":
      self = .aztec
      return
    case "cat-body":
      if #available(iOS 13.0, *) {
        self = .catBody
        return
      } else {
        throw EnumParserError.unsupportedOS(supportedOnOS: "13.0")
      }
    case "code-128":
      self = .code128
      return
    case "code-39":
      self = .code39
      return
    case "code-39-mod-43":
      self = .code39Mod43
      return
    case "code-93":
      self = .code93
      return
    case "data-matrix":
      self = .dataMatrix
      return
    case "dog-body":
      if #available(iOS 13.0, *) {
        self = .dogBody
        return
      } else {
        throw EnumParserError.unsupportedOS(supportedOnOS: "13.0")
      }
    case "ean-13":
      self = .ean13
      return
    case "ean-8":
      self = .ean8
      return
    case "face":
      self = .face
      return
    case "human-body":
      if #available(iOS 13.0, *) {
        self = .humanBody
        return
      } else {
        throw EnumParserError.unsupportedOS(supportedOnOS: "13.0")
      }
    case "interleaved-2-of-5":
      self = .interleaved2of5
      return
    case "itf-14":
      self = .itf14
      return
    case "pdf-417":
      self = .pdf417
      return
    case "qr":
      self = .qr
      return
    case "salient-object":
      if #available(iOS 13.0, *) {
        self = .salientObject
        return
      } else {
        throw EnumParserError.unsupportedOS(supportedOnOS: "13.0")
      }
    case "upce":
      self = .upce
      return
    default:
      throw EnumParserError.invalidValue
    }
  }

  var descriptor: String {
    if #available(iOS 13.0, *) {
      switch self {
      case .catBody:
        return "cat-body"
      case .dogBody:
        return "dog-body"
      case .humanBody:
        return "human-body"
      case .salientObject:
        return "salient-object"
      default: break
      }
    }
    switch self {
    case .aztec:
      return "aztec"
    case .code128:
      return "code-128"
    case .code39:
      return "code-39"
    case .code39Mod43:
      return "code-39-mod-43"
    case .code93:
      return "code-93"
    case .dataMatrix:
      return "data-matrix"
    case .ean13:
      return "ean-13"
    case .ean8:
      return "ean-8"
    case .face:
      return "face"
    case .interleaved2of5:
      return "interleaved-2-of-5"
    case .itf14:
      return "itf-14"
    case .pdf417:
      return "pdf-417"
    case .qr:
      return "qr"
    case .upce:
      return "upce"
    default:
      fatalError("AVMetadataObject.ObjectType has unknown state.")
    }
  }
}
