///
/// AV+VideoCodec.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension VideoCodec {
  init(avCodec: AVVideoCodecType) {
    switch avCodec {
    case .h264:
      self = .h264
    case .hevc:
      self = .h265
    case .hevcWithAlpha:
      self = .h265WithAlpha
    case .proRes422Proxy:
      self = .proRes422Proxy
    case .proRes422LT:
      self = .proRes422Lt
    case .proRes422:
      self = .proRes422
    case .proRes422HQ:
      self = .proRes422Hq
    case .proRes4444:
      self = .proRes4444
    case .jpeg:
      self = .jpeg
    default:
      if #available(iOS 18.0, *) {
        if avCodec == .appleProRes4444XQ {
          self = .proRes4444Xq
          return
        }
      }
      if #available(iOS 26.0, *) {
        if avCodec == .proResRAW {
          self = .proResRaw
          return
        } else if avCodec == .proResRAWHQ {
          self = .proResRawHq
          return
        }
      }
      logger.error("Received unknown AVVideoCodecType: \(avCodec.rawValue)")
      self = .unknown
    }
  }

  var isRawCodec: Bool {
    switch self {
    case .proRes422Proxy, .proRes422Lt, .proRes422, .proRes422Hq, .proRes4444, .proRes4444Xq,
      .proResRawHq, .proResRaw:
      return true
    default:
      return false
    }
  }

  func toAVVideoCodecType() throws -> AVVideoCodecType {
    switch self {
    case .unknown:
      throw RuntimeError.error(
        withMessage: "VideoCodec \"unknown\" cannot be used as AVVideoCodecType!")
    case .h264:
      return .h264
    case .h265:
      return .hevc
    case .h265WithAlpha:
      return .hevcWithAlpha
    case .proRes422Proxy:
      return .proRes422Proxy
    case .proRes422Lt:
      return .proRes422LT
    case .proRes422:
      return .proRes422
    case .proRes422Hq:
      return .proRes422HQ
    case .proRes4444:
      return .proRes4444
    case .jpeg:
      return .jpeg
    case .proRes4444Xq:
      guard #available(iOS 18.0, *) else {
        throw RuntimeError.error(
          withMessage: "VideoCodec \"pro-res-4444-xq\" is only available on iOS 18.0 or higher!")
      }
      return .appleProRes4444XQ
    case .proResRaw:
      guard #available(iOS 26.0, *) else {
        throw RuntimeError.error(
          withMessage: "VideoCodec \"pro-res-raw\" is only available on iOS 18.0 or higher!")
      }
      return .proResRAW
    case .proResRawHq:
      guard #available(iOS 26.0, *) else {
        throw RuntimeError.error(
          withMessage: "VideoCodec \"pro-res-raw-hq\" is only available on iOS 18.0 or higher!")
      }
      return .proResRAWHQ
    }
  }
}
