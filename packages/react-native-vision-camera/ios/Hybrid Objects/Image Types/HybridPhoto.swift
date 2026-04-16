//
//  HybridPhoto.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import AVFoundation
import Foundation
import NitroImage
import NitroModules

final class HybridPhoto: HybridPhotoSpec, NativePhoto {
  let photo: AVCapturePhoto
  let metadata: MediaSampleMetadata
  let containerFormat: PhotoContainerFormat

  init(
    photo: AVCapturePhoto,
    metadata: MediaSampleMetadata,
    containerFormat: PhotoContainerFormat
  ) {
    self.photo = photo
    self.metadata = metadata
    self.containerFormat = containerFormat
    super.init()
  }

  var memorySize: Int {
    return photo.memorySize
  }

  // pragma MARK: Photo metadata

  var timestamp: Double {
    return photo.timestamp.seconds
  }
  var isMirrored: Bool {
    return metadata.isMirrored
  }
  var orientation: Orientation {
    return metadata.orientation
  }

  var isRawPhoto: Bool {
    return photo.isRawPhoto
  }

  var depth: (any HybridDepthSpec)? {
    guard let depthData = photo.depthData else {
      return nil
    }
    return HybridDepth(
      depthData: depthData,
      metadata: metadata)
  }

  var size: CMVideoDimensions {
    if isRawPhoto {
      return photo.resolvedSettings.rawPhotoDimensions
    } else {
      return photo.resolvedSettings.photoDimensions
    }
  }
  var width: Double {
    return Double(size.width)
  }
  var height: Double {
    return Double(size.height)
  }

  var calibrationData: (any HybridCameraCalibrationDataSpec)? {
    guard let calibrationData = photo.cameraCalibrationData else {
      return nil
    }
    return HybridCameraCalibrationData(calibrationData: calibrationData)
  }

  // pragma MARK: Pixel Buffer access

  var hasPixelBuffer: Bool {
    return photo.pixelBuffer != nil
  }
  func getPixelBuffer() throws -> ArrayBuffer {
    guard let pixelBuffer = photo.pixelBuffer else {
      throw RuntimeError.error(
        withMessage: "This Photo does not contain a pixel buffer! "
          + "Check `photo.hasPixelBuffer` before calling `photo.getPixelBuffer()`")
    }
    return try ArrayBuffer.fromPixelBuffer(pixelBuffer)
  }

  // pragma MARK: File Data

  func getFileData() throws -> ArrayBuffer {
    guard let data = photo.fileDataRepresentation() else {
      throw RuntimeError.error(withMessage: "Failed to get photo's file data!")
    }
    return try ArrayBuffer.copy(data: data)
  }

  func getFileDataAsync() throws -> Promise<ArrayBuffer> {
    return Promise.async {
      return try self.getFileData()
    }
  }

  // pragma MARK: Saving Photo to File

  private func saveImage(to path: String) throws {
    guard let data = photo.fileDataRepresentation() else {
      throw RuntimeError.error(withMessage: "Failed to get file data representation of Photo!")
    }
    guard let url = URL(string: path) else {
      throw RuntimeError.error(withMessage: "The given path \"\(path)\" is not a valid URL!")
    }
    try data.write(to: url)
  }

  func saveToFileAsync(path: String) throws -> Promise<Void> {
    return Promise.async(.utility) {
      try self.saveImage(to: path)
    }
  }

  func saveToTemporaryFileAsync() throws -> Promise<String> {
    return Promise.async(.utility) {
      // 1. Create temp path
      let fileType = try self.containerFormat.toUTType()
      let file = try URL.createTempURL(fileType: fileType)
      let path = file.absoluteString
      // 2. Save image
      try self.saveImage(to: path)
      // 3. Return path
      return path
    }
  }

  func toImage() throws -> any HybridImageSpec {
    guard let cgImage = photo.cgImageRepresentation() else {
      if isRawPhoto {
        throw RuntimeError.error(
          withMessage: "Failed to get Image data! Raw Photos cannot be converted to Images.")
      } else {
        throw RuntimeError.error(withMessage: "Failed to get Image data!")
      }
    }
    let uiOrientation = orientation.toUIImageOrientation(isMirrored: isMirrored)
    let uiImage = UIImage(cgImage: cgImage, scale: 1, orientation: uiOrientation)
    return HybridUIImage(uiImage: uiImage)
  }

  func toImageAsync() throws -> Promise<any HybridImageSpec> {
    return Promise.async {
      return try self.toImage()
    }
  }
}
