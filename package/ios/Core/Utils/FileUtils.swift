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
   Writes Data to a temporary file.
   */
  private static func writeDataToFile(data: Data, file: URL) throws {
    do {
      if file.isFileURL {
        try data.write(to: file)
      } else {
        guard let url = URL(string: "file://\(file.absoluteString)") else {
          throw CameraError.capture(.createTempFileError(message: "Cannot create URL with file:// prefix!"))
        }
        try data.write(to: url)
      }
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

  static func getFilePath(directory: URL, fileExtension: String) throws -> URL {
    // Random UUID filename
    let filename = createRandomFileName(withExtension: fileExtension)
    return directory.appendingPathComponent(filename)
  }

  static func getFilePath(customDirectory: String, fileExtension: String) throws -> URL {
    // Prefix with file://
    let prefixedDirectory = customDirectory.starts(with: "file:") ? customDirectory : "file://\(customDirectory)"
    // Create URL
    guard let url = URL(string: prefixedDirectory) else {
      throw CameraError.capture(.invalidPath(path: customDirectory))
    }
    return try getFilePath(directory: url, fileExtension: fileExtension)
  }

  static func getFilePath(fileExtension: String) throws -> URL {
    return try getFilePath(directory: tempDirectory, fileExtension: fileExtension)
  }
}
