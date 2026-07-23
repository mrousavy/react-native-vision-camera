//
//  ML+HybridFrameSpec.swift
//  VisionCameraBarcodeScanner
//
//  Created by Marc Rousavy on 08.02.26.
//

import CoreImage
import CoreMedia
import MLKitVision
import NitroModules
import VisionCamera

private let ciContext = CIContext(options: [.useSoftwareRenderer: false])

extension HybridFrameSpec_protocol {
  func toMLImage() throws -> MLImage {
    guard let nativeFrame = self as? any NativeFrame else {
      throw RuntimeError.error(withMessage: "Frame is not of type `NativeFrame`!")
    }
    guard let sampleBuffer = nativeFrame.sampleBuffer else {
      throw RuntimeError.error(withMessage: "Frame doesn't have a CMSampleBuffer - it's invalid!")
    }
    let orientation = self.orientation.toUIImageOrientation(isMirrored: self.isMirrored)

    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
      throw RuntimeError.error(withMessage: "Frame doesn't have a pixel buffer - it's invalid!")
    }
    let pixelFormat = CVPixelBufferGetPixelFormatType(pixelBuffer)
    switch pixelFormat {
    case kCVPixelFormatType_420YpCbCr8BiPlanarFullRange,
      kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange:
      // Fast path: MLKit reads YUV sample buffers (the format the Camera
      // streams in) directly.
      guard let image = MLImage(sampleBuffer: sampleBuffer) else {
        throw RuntimeError.error(withMessage: "Failed to create MLImage from CMSampleBuffer!")
      }
      image.orientation = orientation
      return image
    default:
      // MLKit mis-reads some non-YUV sample buffers (e.g. BGRA buffers
      // with padded row strides) - render those to a UIImage first.
      let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
      guard let cgImage = ciContext.createCGImage(ciImage, from: ciImage.extent) else {
        throw RuntimeError.error(
          withMessage: "Failed to render the Frame's pixel buffer to a CGImage!")
      }
      let uiImage = UIImage(cgImage: cgImage)
      guard let image = MLImage(image: uiImage) else {
        throw RuntimeError.error(withMessage: "Failed to create MLImage from UIImage!")
      }
      image.orientation = orientation
      return image
    }
  }
}
