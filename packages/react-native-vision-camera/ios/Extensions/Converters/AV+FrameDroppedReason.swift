///
/// AV+FrameDroppedReason.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension FrameDroppedReason {
  init(reason: AVCaptureOutput.DataDroppedReason) {
    switch reason {
    case .lateData:
      self = .frameWasLate
    case .outOfBuffers:
      self = .outOfBuffers
    case .discontinuity:
      self = .discontinuity
    default:
      self = .unknown
    }
  }

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
