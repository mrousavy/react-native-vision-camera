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

/**
 * An implementation of `Image` (from `react-native-nitro-image`) that
 * holds an `AVCapturePhoto`
 */
class HybridPhoto: HybridImageSpec {
  let photo: AVCapturePhoto
  
  init(photo: AVCapturePhoto) {
    self.photo = photo
    super.init()
  }
  
  var width: Double {
    guard let pixelBuffer = photo.pixelBuffer else {
      return 0
    }
    return Double(CVPixelBufferGetWidth(pixelBuffer))
  }
  var height: Double {
    guard let pixelBuffer = photo.pixelBuffer else {
      return 0
    }
    return Double(CVPixelBufferGetHeight(pixelBuffer))
  }
  
  func toRawPixelData(allowGpu: Bool?) throws -> RawPixelData {
    guard let pixelBuffer = photo.pixelBuffer else {
      throw RuntimeError.error(withMessage: "This Photo does not contain raw pixel data!")
    }
    guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else {
      throw RuntimeError.error(withMessage: "Photo's PixelBuffer does not contain CPU-mapped data!")
    }
    
    let buffer = ArrayBuffer.wrap(dataWithoutCopy: baseAddress,
                                  size: CVPixelBufferGetDataSize(pixelBuffer)) {
      print("Releasing \(pixelBuffer)")
    }
    return RawPixelData(buffer: buffer,
                        width: Double(CVPixelBufferGetWidth(pixelBuffer)),
                        height: Double(CVPixelBufferGetHeight(pixelBuffer)),
                        pixelFormat: .rgba)
  }
  
  func toRawPixelDataAsync(allowGpu: Bool?) throws -> Promise<RawPixelData> {
    return Promise.async {
      return try self.toRawPixelData(allowGpu: allowGpu)
    }
  }
  
  func toEncodedImageData(format: ImageFormat, quality: Double?) throws -> EncodedImageData {
    throw RuntimeError.error(withMessage: "This method is not yet implemented!")
  }
  
  func toEncodedImageDataAsync(format: ImageFormat, quality: Double?) throws -> Promise<EncodedImageData> {
    throw RuntimeError.error(withMessage: "This method is not yet implemented!")
  }
  
  func resize(width: Double, height: Double) throws -> any HybridImageSpec {
    throw RuntimeError.error(withMessage: "This method is not yet implemented!")
  }
  
  func resizeAsync(width: Double, height: Double) throws -> Promise<any HybridImageSpec> {
    throw RuntimeError.error(withMessage: "This method is not yet implemented!")
  }
  
  func crop(startX: Double, startY: Double, endX: Double, endY: Double) throws -> any HybridImageSpec {
    throw RuntimeError.error(withMessage: "This method is not yet implemented!")
  }
  
  func cropAsync(startX: Double, startY: Double, endX: Double, endY: Double) throws -> Promise<any HybridImageSpec> {
    throw RuntimeError.error(withMessage: "This method is not yet implemented!")
  }
  
  func saveToFileAsync(path: String, format: ImageFormat, quality: Double?) throws -> Promise<Void> {
    throw RuntimeError.error(withMessage: "This method is not yet implemented!")
  }
  
  func saveToTemporaryFileAsync(format: ImageFormat, quality: Double?) throws -> Promise<String> {
    throw RuntimeError.error(withMessage: "This method is not yet implemented!")
  }
  
  func toThumbHash() throws -> ArrayBuffer {
    throw RuntimeError.error(withMessage: "This method is not yet implemented!")
  }
  
  func toThumbHashAsync() throws -> Promise<ArrayBuffer> {
    throw RuntimeError.error(withMessage: "This method is not yet implemented!")
  }
}
