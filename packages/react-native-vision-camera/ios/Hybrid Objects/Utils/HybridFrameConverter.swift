///
/// HybridFrameConverter.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroImage
import NitroModules

final class HybridFrameConverter: HybridFrameConverterSpec {
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

  func convertImageToFrame(
    image: any HybridImageSpec,
    orientation: CameraOrientation,
    isMirrored: Bool
  ) throws -> any HybridFrameSpec {
    guard let image = image as? any NativeImage else {
      throw RuntimeError.error(withMessage: "The given `Image` is not of type `NativeImage`!")
    }
    let timestamp = CMClockGetTime(CMClockGetHostTimeClock())
    let sampleBuffer = try image.uiImage.toCMSampleBuffer(
      orientation: orientation,
      isMirrored: isMirrored,
      timestamp: timestamp)
    let metadata = MediaSampleMetadata(
      timestamp: timestamp,
      orientation: orientation,
      isMirrored: isMirrored)
    return HybridFrame(buffer: sampleBuffer, metadata: metadata)
  }

  func convertImageToFrameAsync(
    image: any HybridImageSpec,
    orientation: CameraOrientation,
    isMirrored: Bool
  ) throws -> Promise<any HybridFrameSpec> {
    return Promise.async {
      return try self.convertImageToFrame(
        image: image,
        orientation: orientation,
        isMirrored: isMirrored)
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
