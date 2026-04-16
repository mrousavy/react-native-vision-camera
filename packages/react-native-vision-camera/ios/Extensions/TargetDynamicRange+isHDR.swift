///
/// TargetDynamicRange+isHDR.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension TargetDynamicRange {
  var isHDR: Bool {
    return self.bitDepth == .hdr10Bit || self.colorSpace == .hlgBt2020
  }
}
