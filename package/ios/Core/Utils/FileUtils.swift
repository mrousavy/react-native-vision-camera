//
//  FileUtils.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 26.02.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

import AVFoundation
import CoreLocation
import Foundation
import UIKit

enum FileUtils {
  /**
   Writes Data to a temporary file and returns the file path.
   */
  private static func writeDataToFile(data: Data, file: URL) throws {
    do {
      try data.write(to: file)
    } catch {
      throw CameraError.capture(.fileError(cause: error))
    }
  }

  static func writePhotoToFile(photo: AVCapturePhoto, metadataProvider: MetadataProvider, file: URL) throws {
    guard let data = photo.fileDataRepresentation(with: metadataProvider) else {
      throw CameraError.capture(.imageDataAccessError)
    }
    try writeDataToFile(data: data, file: file)
  }

  static func writeUIImageToFile(image: UIImage, file: URL, compressionQuality: CGFloat = 1.0) throws {
    guard let data = image.jpegData(compressionQuality: compressionQuality) else {
      throw CameraError.capture(.imageDataAccessError)
    }
    try writeDataToFile(data: data, file: file)
  }

  static var tempDirectory: URL {
    return FileManager.default.temporaryDirectory
  }

  static func createRandomFileName(withExtension fileExtension: String) -> String {
    return UUID().uuidString + "." + fileExtension
  }
}
