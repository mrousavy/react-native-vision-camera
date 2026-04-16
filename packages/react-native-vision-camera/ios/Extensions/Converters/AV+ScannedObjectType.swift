///
/// AV+ScannedObjectType.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension ScannedObjectType {
  init(type: AVMetadataObject.ObjectType) {
    switch type {
    case .code39:
      self = .code39
    case .code39Mod43:
      self = .code39Mod43
    case .code93:
      self = .code93
    case .code128:
      self = .code128
    case .ean8:
      self = .ean8
    case .ean13:
      self = .ean13
    case .interleaved2of5:
      self = .interleaved2Of5
    case .itf14:
      self = .itf14
    case .upce:
      self = .upcE
    case .aztec:
      self = .aztec
    case .dataMatrix:
      self = .dataMatrix
    case .pdf417:
      self = .pdf417
    case .qr:
      self = .qr
    case .humanBody:
      self = .humanBody
    case .dogBody:
      self = .dogBody
    case .catBody:
      self = .catBody
    case .face:
      self = .face
    case .salientObject:
      self = .salientObject
    default:
      if #available(iOS 15.4, *), type == .codabar {
        self = .codabar
      } else if #available(iOS 15.4, *), type == .gs1DataBar {
        self = .gs1DataBar
      } else if #available(iOS 15.4, *), type == .gs1DataBarLimited {
        self = .gs1DataBarLimited
      } else if #available(iOS 15.4, *), type == .gs1DataBarExpanded {
        self = .gs1DataBarExpanded
      } else if #available(iOS 15.4, *), type == .microPDF417 {
        self = .microPdf417
      } else if #available(iOS 15.4, *), type == .microQR {
        self = .microQr
      } else if #available(iOS 17.0, *), type == .humanFullBody {
        self = .humanFullBody
      } else if #available(iOS 26.0, *), type == .dogHead {
        self = .dogHead
      } else if #available(iOS 26.0, *), type == .catHead {
        self = .catHead
      } else {
        logger.error("Unknown AVMetadataObject.ObjectType: \(type.rawValue)")
        self = .unknown
      }
    }
  }

  func toAVMetadataObjectType() -> AVMetadataObject.ObjectType? {
    switch self {
    case .codabar:
      if #available(iOS 15.4, *) {
        return .codabar
      } else {
        return nil
      }
    case .code39:
      return .code39
    case .code39Mod43:
      return .code39Mod43
    case .code93:
      return .code93
    case .code128:
      return .code128
    case .ean8:
      return .ean8
    case .ean13:
      return .ean13
    case .gs1DataBar:
      if #available(iOS 15.4, *) {
        return .gs1DataBar
      } else {
        return nil
      }
    case .gs1DataBarExpanded:
      if #available(iOS 15.4, *) {
        return .gs1DataBarExpanded
      } else {
        return nil
      }
    case .gs1DataBarLimited:
      if #available(iOS 15.4, *) {
        return .gs1DataBarLimited
      } else {
        return nil
      }
    case .interleaved2Of5:
      return .interleaved2of5
    case .itf14:
      return .itf14
    case .upcE:
      return .upce
    case .aztec:
      return .aztec
    case .dataMatrix:
      return .dataMatrix
    case .microPdf417:
      if #available(iOS 15.4, *) {
        return .microPDF417
      } else {
        return nil
      }
    case .microQr:
      if #available(iOS 15.4, *) {
        return .microQR
      } else {
        return nil
      }
    case .pdf417:
      return .pdf417
    case .qr:
      return .qr
    case .humanBody:
      return .humanBody
    case .humanFullBody:
      if #available(iOS 17.0, *) {
        return .humanFullBody
      } else {
        return nil
      }
    case .dogHead:
      if #available(iOS 26.0, *) {
        return .dogHead
      } else {
        return nil
      }
    case .dogBody:
      return .dogBody
    case .catHead:
      if #available(iOS 26.0, *) {
        return .catHead
      } else {
        return nil
      }
    case .catBody:
      return .catBody
    case .face:
      return .face
    case .salientObject:
      return .salientObject
    case .unknown:
      return nil
    }
  }
}
