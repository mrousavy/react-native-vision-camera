///
/// CMSampleBuffer+toUIImage.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation
import CoreImage

extension CMSampleBuffer {
  private static let context = CIContext(options: [.useSoftwareRenderer: false])
  
  func toUIImage(orientation: UIImage.Orientation) throws -> UIImage {
    guard let imageBuffer else {
      throw RuntimeError.error(withMessage: "This Frame does not have a PixelBuffer!")
    }
    
    // Copy over any attachments (colorspace, EXIF, ...)
    let attachments = CMCopyDictionaryOfAttachments(allocator: kCFAllocatorDefault,
                                                    target: self,
                                                    attachmentMode: kCMAttachmentMode_ShouldPropagate)
    let ciAttachments = attachments as? [CIImageOption: Any]
    // No-copy wrap the PixelBuffer in a CIImage
    let ciImage = CIImage(cvPixelBuffer: imageBuffer, options: ciAttachments)
    // Copy the CIImage into a CGImage (render)
    guard let cgImage = Self.context.createCGImage(ciImage,
                                                   from: ciImage.extent) else {
      throw RuntimeError.error(withMessage: "Failed to copy Frame into CGImage!")
    }
    // No-copy wrap the CGImage in a UIImage
    return UIImage(cgImage: cgImage,
                   scale: 1,
                   orientation: orientation)
  }
}
