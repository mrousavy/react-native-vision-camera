///
/// UIImage+toCMSampleBuffer.swift
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

import AVFoundation
import CoreImage
import Foundation
import NitroModules
import UIKit

extension UIImage {
  private static let context = CIContext(options: [.useSoftwareRenderer: false])

  /**
   * Converts this `UIImage` to a YUV 4:2:0 full-range `CMSampleBuffer`
   * (the same format the Camera streams Frames in), physically rotating
   * and mirroring the pixel data so that interpreting the resulting buffer
   * with the given `orientation` and `isMirrored` flags yields this
   * (upright) `UIImage` again.
   */
  func toCMSampleBuffer(
    orientation: CameraOrientation,
    isMirrored: Bool,
    timestamp: CMTime
  ) throws -> CMSampleBuffer {
    // 1. Get the underlying CIImage or CGImage, and bake this UIImage's own
    //    orientation flag into the pixels so we start with upright content.
    var ciImage: CIImage
    if let cgImage {
      ciImage = CIImage(cgImage: cgImage)
    } else if let underlyingCiImage = self.ciImage {
      ciImage = underlyingCiImage
    } else {
      throw RuntimeError.error(withMessage: "Failed to get the Image's underlying CGImage!")
    }
    ciImage = ciImage.oriented(CGImagePropertyOrientation(imageOrientation))

    // 2. Bake the inverse of the target orientation into the pixels, so
    //    displaying the buffer with the target orientation/mirror flags
    //    yields the upright content again.
    let targetOrientation = orientation.toUIImageOrientation(isMirrored: isMirrored)
    ciImage = ciImage.oriented(CGImagePropertyOrientation(targetOrientation.inverted))

    // 3. Move the extent to the origin so we can render into a buffer.
    ciImage = ciImage.transformed(
      by: CGAffineTransform(
        translationX: -ciImage.extent.origin.x,
        y: -ciImage.extent.origin.y))

    // 4. Render into a YUV 4:2:0 full-range CVPixelBuffer.
    let width = Int(ciImage.extent.width.rounded())
    let height = Int(ciImage.extent.height.rounded())
    let attributes: [CFString: Any] = [
      kCVPixelBufferIOSurfacePropertiesKey: [:] as CFDictionary
    ]
    var pixelBuffer: CVPixelBuffer?
    let result = CVPixelBufferCreate(
      kCFAllocatorDefault,
      width,
      height,
      kCVPixelFormatType_420YpCbCr8BiPlanarFullRange,
      attributes as CFDictionary,
      &pixelBuffer)
    guard result == kCVReturnSuccess, let pixelBuffer else {
      throw RuntimeError.error(
        withMessage: "Failed to create a \(width)x\(height) YUV 4:2:0 CVPixelBuffer! Status: \(result)")
    }
    CVBufferSetAttachment(
      pixelBuffer,
      kCVImageBufferYCbCrMatrixKey,
      kCVImageBufferYCbCrMatrix_ITU_R_601_4,
      .shouldPropagate)
    Self.context.render(ciImage, to: pixelBuffer)

    // 5. Wrap the CVPixelBuffer in a CMSampleBuffer.
    let format = try CMFormatDescription(imageBuffer: pixelBuffer)
    let timing = CMSampleTimingInfo(
      duration: .zero,
      presentationTimeStamp: timestamp,
      decodeTimeStamp: .zero)
    return try CMSampleBuffer(
      imageBuffer: pixelBuffer,
      formatDescription: format,
      sampleTiming: timing)
  }
}
