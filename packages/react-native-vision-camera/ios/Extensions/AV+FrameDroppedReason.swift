///
/// AV+FrameDroppedReason.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension FrameDroppedReason {
  init(sampleBufferReason: CMAttachmentBearerAttachments.Value) {
    let stringReason = sampleBufferReason.value as? String
    switch stringReason as CFString? {
    case kCMSampleBufferDroppedFrameReason_FrameWasLate:
      self = .frameWasLate
    case kCMSampleBufferDroppedFrameReason_OutOfBuffers:
      self = .outOfBuffers
    case kCMSampleBufferDroppedFrameReason_Discontinuity:
      self = .discontinuity
    default:
      self = .unknown
    }
  }
}
