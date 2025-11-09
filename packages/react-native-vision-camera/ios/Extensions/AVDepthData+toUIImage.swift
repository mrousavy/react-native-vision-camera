///
/// AVDepthData+toUIImage.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation
import CoreImage

extension AVDepthData {
  func toUIImage(orientation: UIImage.Orientation) throws -> UIImage {
    // No-copy create CIImage from AVDepthData
    guard let ciImage = CIImage(depthData: self) else {
      throw RuntimeError.error(withMessage: "Failed to convert Depth to Image!")
    }
    // Convert CIImage to UIImage
    return try ciImage.toUIImage(orientation: orientation)
  }
}
