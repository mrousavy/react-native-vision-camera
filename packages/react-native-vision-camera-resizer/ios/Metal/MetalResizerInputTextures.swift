//
//  MetalResizerInputTextures.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.03.26.
//

import CoreVideo
import Foundation
import Metal
import NitroModules

/// Wraps one `CVMetalTexture` together with the `MTLTexture` view used by the shader.
struct PlaneTexture {
  let cvTexture: CVMetalTexture
  let texture: MTLTexture
}

/// The input layout sampled by the resizer shader.
/// The raw values match the `inputFormat` uniform in `ResizerKernels.metal`.
enum MetalResizerInputFormat: UInt32 {
  /// primary = Y plane, secondary = interleaved CbCr plane
  case yuvBiplanar = 0
  /// primary = full-resolution BGRA texture, secondary unused
  case bgra = 1
}

/// Holds the sampled camera textures for one resizer dispatch.
struct MetalResizerInputTextures {
  let primary: PlaneTexture
  let secondary: PlaneTexture
  let format: MetalResizerInputFormat

  /**
   * Wraps the current input pixel buffer into the Metal textures expected by the resizer shader.
   */
  static func make(
    from pixelBuffer: CVPixelBuffer,
    textureCache: CVMetalTextureCache
  ) throws -> MetalResizerInputTextures {
    let pixelFormat = CVPixelBufferGetPixelFormatType(pixelBuffer)
    switch pixelFormat {
    case kCVPixelFormatType_420YpCbCr8BiPlanarFullRange:
      let yPlane = try makePlaneTexture(
        pixelBuffer: pixelBuffer,
        textureCache: textureCache,
        pixelFormat: .r8Unorm,
        planeIndex: 0)
      let uvPlane = try makePlaneTexture(
        pixelBuffer: pixelBuffer,
        textureCache: textureCache,
        pixelFormat: .rg8Unorm,
        planeIndex: 1)
      return MetalResizerInputTextures(primary: yPlane, secondary: uvPlane, format: .yuvBiplanar)
    case kCVPixelFormatType_32BGRA:
      let bgra = try makePlaneTexture(
        pixelBuffer: pixelBuffer,
        textureCache: textureCache,
        pixelFormat: .bgra8Unorm,
        planeIndex: 0)
      // The secondary texture slot is never sampled for BGRA inputs, but
      // Metal requires every statically-reachable argument to be bound -
      // bind the same texture again as a placeholder.
      return MetalResizerInputTextures(primary: bgra, secondary: bgra, format: .bgra)
    default:
      throw RuntimeError.error(
        withMessage:
          "Unsupported input pixel format \(pixelFormat). "
          + "Expected kCVPixelFormatType_420YpCbCr8BiPlanarFullRange or kCVPixelFormatType_32BGRA.")
    }
  }

  private static func makePlaneTexture(
    pixelBuffer: CVPixelBuffer,
    textureCache: CVMetalTextureCache,
    pixelFormat: MTLPixelFormat,
    planeIndex: Int
  ) throws -> PlaneTexture {
    let width = CVPixelBufferGetWidthOfPlane(pixelBuffer, planeIndex)
    let height = CVPixelBufferGetHeightOfPlane(pixelBuffer, planeIndex)

    var cvTexture: CVMetalTexture?
    let status = CVMetalTextureCacheCreateTextureFromImage(
      kCFAllocatorDefault,
      textureCache,
      pixelBuffer,
      nil,
      pixelFormat,
      width,
      height,
      planeIndex,
      &cvTexture)

    guard status == kCVReturnSuccess, let cvTexture else {
      throw RuntimeError.error(
        withMessage:
          "Failed to create Metal texture for plane \(planeIndex) (status \(status)).")
    }
    guard let texture = CVMetalTextureGetTexture(cvTexture) else {
      throw RuntimeError.error(withMessage: "Failed to get Metal texture for plane \(planeIndex).")
    }

    return PlaneTexture(cvTexture: cvTexture, texture: texture)
  }
}
