///
/// AV+PhotoContainerFormat.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension PhotoContainerFormat {
  init(avFileType: AVFileType) {
    switch avFileType {
    case .dng:
      self = .dng
    case .heic:
      self = .heic
    case .jpg:
      self = .jpeg
    case .tif:
      self = .tiff
    default:
      if #available(iOS 26.0, *) {
        if avFileType == .dcm {
          self = .dcm
          return
        }
      }
      logger.error("Received unknown AVFileType: \(avFileType.rawValue)")
      self = .unknown
    }
  }

  init(targetFormat: TargetPhotoContainerFormat) {
    switch targetFormat {
    case .native:
      // Apple's default Photo Format is HEIC
      self = .heic
    case .jpeg:
      self = .jpeg
    case .heic:
      self = .heic
    case .dng:
      self = .dng
    }
  }

  func toUTType() throws -> UTType {
    switch self {
    case .unknown:
      throw RuntimeError.error(withMessage: "Cannot convert \"unknown\" ImageFormat to AVFileType!")
    case .jpeg:
      return .jpeg
    case .heic:
      return .heic
    case .tiff:
      return .tiff
    case .dcm:
      guard let type = UTType(tag: "dcm", tagClass: .filenameExtension, conformingTo: nil) else {
        throw RuntimeError.error(
          withMessage: "PhotoContainerFormat \"dcm\" cannot be converted to UTType!")
      }
      return type
    case .dng:
      guard #available(iOS 18.0, *) else {
        throw RuntimeError.error(
          withMessage: "PhotoContainerFormat \"dng\" is only available on iOS 18.0 or newer!")
      }
      return .dng
    }
  }
}
