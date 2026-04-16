///
/// HybridFrameConverter.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroImage
import NitroModules

class HybridFrameConverter: HybridFrameConverterSpec {
  func convertFrameToImage(frame: any HybridFrameSpec) throws -> any HybridImageSpec {
    guard let frame = frame as? any NativeFrame else {
      throw RuntimeError.error(withMessage: "The given `Frame` is not of type `NativeFrame`!")
    }
    guard let sampleBuffer = frame.sampleBuffer else {
      throw RuntimeError.error(withMessage: "The given `Frame` has already been disposed!")
    }
    let uiOrientation = frame.metadata.uiImageOrientation
    let uiImage = try sampleBuffer.toUIImage(orientation: uiOrientation)
    return HybridUIImage(uiImage: uiImage)
  }

  func convertFrameToImageAsync(frame: any HybridFrameSpec) throws -> Promise<any HybridImageSpec> {
    return Promise.async {
      return try self.convertFrameToImage(frame: frame)
    }
  }

  func convertDepthToImage(depth: any HybridDepthSpec) throws -> any HybridImageSpec {
    guard let depth = depth as? any NativeDepth else {
      throw RuntimeError.error(withMessage: "The given `Depth` is not of type `NativeDepth`!")
    }
    guard let depthData = depth.depthData else {
      throw RuntimeError.error(withMessage: "Cannot convert an already disposed Depth to an Image!")
    }
    let uiOrientation = depth.metadata.uiImageOrientation
    let uiImage = try depthData.toUIImage(orientation: uiOrientation)
    return HybridUIImage(uiImage: uiImage)
  }

  func convertDepthToImageAsync(depth: any HybridDepthSpec) throws -> Promise<any HybridImageSpec> {
    return Promise.async {
      return try self.convertDepthToImage(depth: depth)
    }
  }
}
