///
/// AVCaptureDevice.Format+supportsOutput.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation

extension AVCaptureDevice.Format {
  func supportsOutput(_ output: AVCaptureOutput) -> Bool {
    let targetOutputClass = type(of: output)
    return self.unsupportedCaptureOutputClasses.allSatisfy { $0 != targetOutputClass }
  }
}
