//
//  AVAssetWriter.Status+descriptor.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 01.05.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation

extension AVAssetWriter.Status {
  var descriptor: String {
    switch self {
    case .cancelled:
      return "cancelled"
    case .completed:
      return "completed"
    case .failed:
      return "failed"
    case .unknown:
      return "unknown"
    case .writing:
      return "writing"
    @unknown default:
      fatalError("Unknown AVAssetWriter.Status value! \(rawValue)")
    }
  }
}
