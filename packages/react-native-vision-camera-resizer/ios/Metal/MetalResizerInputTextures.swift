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
/// Each format has its own set of `resize_<format>_*` kernels in `ResizerKernels.metal`.
enum MetalResizerInputFormat {
  case yuvBiplanar
  case bgra
}

/// Holds the sampled camera textures for one resizer dispatch.
enum MetalResizerInputTextures {
  /// A YUV 4:2:0 bi-planar input: a full-resolution Y plane and a
  /// half-resolution interleaved CbCr plane.
  case yuvBiplanar(yPlane: PlaneTexture, uvPlane: PlaneTexture)
  /// A full-resolution interleaved BGRA input.
  case bgra(texture: PlaneTexture)

  var format: MetalResizerInputFormat {
    switch self {
    case .yuvBiplanar:
      return .yuvBiplanar
    case .bgra:
      return .bgra
    }
  }

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
      return .yuvBiplanar(yPlane: yPlane, uvPlane: uvPlane)
    case kCVPixelFormatType_32BGRA:
      let bgra = try makePlaneTexture(
        pixelBuffer: pixelBuffer,
        textureCache: textureCache,
        pixelFormat: .bgra8Unorm,
        planeIndex: 0)
      return .bgra(texture: bgra)
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
