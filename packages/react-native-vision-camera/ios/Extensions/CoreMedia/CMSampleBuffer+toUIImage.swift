///
/// CMSampleBuffer+toUIImage.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import CoreImage
import Foundation
import NitroModules

extension CMSampleBuffer {
  func toUIImage(orientation: UIImage.CameraOrientation) throws -> UIImage {
    guard let imageBuffer else {
      throw RuntimeError.error(withMessage: "This Frame does not have a PixelBuffer!")
    }

    // Copy over any attachments (colorspace, EXIF, ...)
    let attachments = CMCopyDictionaryOfAttachments(
      allocator: kCFAllocatorDefault,
      target: self,
      attachmentMode: kCMAttachmentMode_ShouldPropagate)
    let ciAttachments = attachments as? [CIImageOption: Any]
    // No-copy create CIImage from CVPixelBuffer
    let ciImage = CIImage(cvPixelBuffer: imageBuffer, options: ciAttachments)
    // Convert CIImage to UIImage
    return try ciImage.toUIImage(orientation: orientation)
  }
}
