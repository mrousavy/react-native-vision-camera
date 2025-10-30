//
//  HybridPhoto.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.10.25.
//

import Foundation
import AVFoundation
import NitroModules
import NitroImage

// Implementation of HybridImageSpec using NitroImage's default UIImage impl (`NativeImage`)
private class HybridImageImpl: HybridImageSpec, NativeImage {
  let uiImage: UIImage
  init(uiImage: UIImage) {
    self.uiImage = uiImage
    super.init()
  }
}

class HybridPhoto: HybridPhotoSpec {
  
  let photo: AVCapturePhoto

  init(photo: AVCapturePhoto) {
    self.photo = photo
    super.init()
  }
  
  // pragma MARK: Photo metadata
  
  var timestamp: Double {
    return photo.timestamp.seconds
  }
  
  var isRawPhoto: Bool {
    return photo.isRawPhoto
  }
  
  var metadata: AnyMap {
    return AnyMap.fromDictionaryIgnoreIncompatible(photo.metadata)
  }
  
  // pragma MARK: Pixel Buffer access
  
  var hasPixelBuffer: Bool {
    return photo.pixelBuffer != nil
  }
  func getPixelBuffer() throws -> ArrayBuffer {
    guard let pixelBuffer = photo.pixelBuffer else {
      throw RuntimeError.error(withMessage: "This Photo does not contain a pixel buffer! " +
                               "Check `photo.hasPixelBuffer` before calling `photo.getPixelBuffer()`")
    }
    return try ArrayBuffer.fromPixelBuffer(pixelBuffer)
  }
  
  // pragma MARK: Preview Pixel Buffer access
  
  var hasPreviewPixelBuffer: Bool {
    return photo.previewPixelBuffer != nil
  }
  func getPreviewPixelBuffer() throws -> ArrayBuffer {
    guard let pixelBuffer = photo.previewPixelBuffer else {
      throw RuntimeError.error(withMessage: "This Photo does not contain a preview pixel buffer! " +
                               "Check `photo.hasPreviewPixelBuffer` before calling `photo.getPreviewPixelBuffer()`")
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
  
  private func saveImage(to path: String, quality: Double) throws {
    // TODO: Use `quality`
    guard let data = photo.fileDataRepresentation() else {
      throw RuntimeError.error(withMessage: "Failed to get file data representation of Photo!")
    }
    guard let url = URL(string: path) else {
      throw RuntimeError.error(withMessage: "The given path \"\(path)\" is not a valid URL!")
    }
    try data.write(to: url)
  }
  
  func saveToFileAsync(path: String, quality: Double) throws -> Promise<Void> {
    return Promise.async(.utility) {
      try self.saveImage(to: path, quality: quality)
    }
  }
  
  func saveToTemporaryFileAsync(quality: Double) throws -> Promise<String> {
    return Promise.async(.utility) {
      // 1. Create temp path
      let tempDirectory = FileManager.default.temporaryDirectory
      let fileName = UUID().uuidString
      let file = tempDirectory.appendingPathComponent(fileName, conformingTo: .jpeg)
      let path = file.absoluteString
      // 2. Save image
      try self.saveImage(to: path, quality: quality)
      // 3. Return path
      return path
    }
  }
  
  // pragma MARK: Conversion to Image
  
  func toPreviewImage() throws -> any HybridImageSpec {
    guard let cgImage = photo.previewCGImageRepresentation() else {
      throw RuntimeError.error(withMessage: "Failed to get Preview Image data!")
    }
    let uiImage = UIImage(cgImage: cgImage)
    return HybridImageImpl(uiImage: uiImage)
  }
  
  func toPreviewImageAsync() throws -> Promise<any HybridImageSpec> {
    return Promise.async {
      return try self.toPreviewImage()
    }
  }
  
  func toImage() throws -> any HybridImageSpec {
    guard let cgImage = photo.cgImageRepresentation() else {
      throw RuntimeError.error(withMessage: "Failed to get Image data!")
    }
    let uiImage = UIImage(cgImage: cgImage)
    return HybridImageImpl(uiImage: uiImage)
  }
  
  func toImageAsync() throws -> Promise<any HybridImageSpec> {
    return Promise.async {
      return try self.toImage()
    }
  }
}
