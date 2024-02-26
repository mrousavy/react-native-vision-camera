//
//  FileUtils.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 26.02.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

import Foundation
import AVFoundation
import UIKit

class FileUtils {
  /**
   Writes Data to a temporary file and returns the file path.
   */
  private static func writeDataToTempFile(data: Data, fileExtension: String = "jpeg") throws -> URL {
    let fileId = UUID().uuidString
    let tempFilePath = FileManager.default.temporaryDirectory
      .appendingPathComponent(fileId)
      .appendingPathComponent(fileExtension)
    try data.write(to: tempFilePath)
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
