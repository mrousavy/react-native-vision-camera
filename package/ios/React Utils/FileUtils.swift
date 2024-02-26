//
//  FileUtils.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 26.02.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation
import UIKit

enum FileUtils {
  /**
   Writes Data to a temporary file and returns the file path.
   */
  private static func writeDataToTempFile(data: Data, fileExtension: String = "jpeg") throws -> URL {
    let filename = UUID().uuidString + "." + fileExtension
    let tempFilePath = FileManager.default.temporaryDirectory
      .appendingPathComponent(filename)
    do {
      try data.write(to: tempFilePath)
    } catch (let error) {
      throw CameraError.capture(.fileError(cause: error))
    }
    return tempFilePath
  }

  static func writePhotoToTempFile(photo: AVCapturePhoto) throws -> URL {
    guard let data = photo.fileDataRepresentation() else {
      throw CameraError.capture(.imageDataAccessError)
    }
    let path = try writeDataToTempFile(data: data)
    return path
  }

  static func writeUIImageToTempFile(image: UIImage, compressionQuality: CGFloat = 1.0) throws -> URL {
    guard let data = image.jpegData(compressionQuality: compressionQuality) else {
      throw CameraError.capture(.imageDataAccessError)
    }
    let path = try writeDataToTempFile(data: data)
    return path
  }
}
