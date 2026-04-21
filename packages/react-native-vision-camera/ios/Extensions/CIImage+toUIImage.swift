///
/// CIImage+toUIImage.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import CoreImage
import Foundation
import NitroModules

extension CIImage {
  private static let context = CIContext(options: [.useSoftwareRenderer: false])

  func toUIImage(orientation: UIImage.CameraOrientation) throws -> UIImage {
    // Copy the CIImage into a CGImage (render)
    guard
      let cgImage = Self.context.createCGImage(
        self,
        from: self.extent)
    else {
      throw RuntimeError.error(withMessage: "Failed to copy CIImage into CGImage!")
    }
    // No-copy wrap the CGImage in a UIImage
    return UIImage(
      cgImage: cgImage,
      scale: 1,
      orientation: orientation)
  }
}
