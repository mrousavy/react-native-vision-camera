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
  
  func toUIImage() throws -> UIImage {
    guard let imageBuffer else {
      throw RuntimeError.error(withMessage: "This Frame does not have a PixelBuffer!")
    }
    
    // Copy over any attachments (colorspace, EXIF, ...)
    let attachments = CMCopyDictionaryOfAttachments(allocator: kCFAllocatorDefault,
                                                    target: self,
                                                    attachmentMode: kCMAttachmentMode_ShouldPropagate)
    let ciAttachments = attachments as? [CIImageOption: Any]
    let ciImage = CIImage(cvPixelBuffer: imageBuffer, options: ciAttachments)
    // return UIImage(ciImage: ciImage)
    guard let cgImage = Self.context.createCGImage(ciImage,
                                                   from: ciImage.extent) else {
      throw RuntimeError.error(withMessage: "Failed to copy Frame into CGImage!")
    }
    return UIImage(cgImage: cgImage,
                   scale: 1,
                   orientation: .up)
  }
}
