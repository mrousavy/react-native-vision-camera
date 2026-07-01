///
/// AVCaptureInput+isMicrophone.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureInput {
  var isMicrophone: Bool {
    return ports.contains { $0.mediaType == .audio }
  }
}
