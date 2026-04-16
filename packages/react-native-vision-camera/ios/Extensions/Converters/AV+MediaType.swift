///
/// MediaType+toAVMediaType.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension MediaType {
  init(type: AVMediaType) {
    switch type {
    case .video:
      self = .video
    case .depthData:
      self = .depth
    case .metadataObject:
      self = .metadata
    default:
      self = .other
    }
  }

  func toAVMediaType() -> AVMediaType {
    switch self {
    case .video:
      return .video
    case .depth:
      return .depthData
    case .metadata:
      return .metadataObject
    case .other:
      fatalError("Cannot convert 'other' to AVMediaType!")
    }
  }
}
