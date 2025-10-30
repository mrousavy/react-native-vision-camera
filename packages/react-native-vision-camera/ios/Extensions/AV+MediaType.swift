///
/// MediaType+toAVMediaType.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension MediaType {
  init(type: AVMediaType) {
    switch type {
    case .video:
      self = .video
    case .depthData:
      self = .depth
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
    case .other:
      fatalError("Cannot convert 'other' to AVMediaType!")
    }
  }
}
