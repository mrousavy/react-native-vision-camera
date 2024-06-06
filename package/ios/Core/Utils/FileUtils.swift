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
  private static func writeDataToFile(data: Data, path: URL) throws {
    do {
      try data.write(to: path)
    } catch {
      throw CameraError.capture(.fileError(cause: error))
    }
  }

  private static func getTemporaryFileURL(fileExtension: String = "jpeg") -> URL {
    let filename = UUID().uuidString + "." + fileExtension
    return FileManager.default.temporaryDirectory.appendingPathComponent(filename)
  }

  static func writePhotoToFile(photo: AVCapturePhoto, path:URL, metadataProvider: MetadataProvider) throws {
    guard let data = photo.fileDataRepresentation(with: metadataProvider) else {
      throw CameraError.capture(.imageDataAccessError)
    }
    try writeDataToFile(data: data, path: path)
  }

  static func writeUIImageToFile(image: UIImage, path: URL, compressionQuality: CGFloat = 1.0) throws {
    guard let data = image.jpegData(compressionQuality: compressionQuality) else {
      throw CameraError.capture(.imageDataAccessError)
    }
    try writeDataToFile(data: data, path: path)
  }

  static func getDestinationURL(path: String?, fileExtension: String) throws -> URL {
    if let path = path {
      let destinationURL = URL(string: path.starts(with: "file://") ? path : "file://" + path)!
      let directory = destinationURL.deletingLastPathComponent()
      // Check if the directory exists
      if !FileManager.default.fileExists(atPath: directory.path) {
        throw CameraError.capture(.invalidPath(message: "Directory does not exist: \(directory.path)"))
      }
      // Check if the directory is a directory
      var isDirectory: ObjCBool = false
      if !FileManager.default.fileExists(atPath: directory.path, isDirectory: &isDirectory) || !isDirectory.boolValue {
        throw CameraError.capture(.invalidPath(message: "Path directory is not a directory: \(directory.path)"))
      }
      // Check if the directory is readable and writable
      if !FileManager.default.isReadableFile(atPath: directory.path) || !FileManager.default.isWritableFile(atPath: directory.path) {
        throw CameraError.capture(.invalidPath(message: "Path directory is not readable or writable: \(directory.path)"))
      }
      // Check if the path doesn't exist
      if FileManager.default.fileExists(atPath: path) {
        throw CameraError.capture(.invalidPath(message: "File already exists at path: \(path)"))
      }
      return destinationURL
    } else {
      return getTemporaryFileURL(fileExtension: fileExtension)
    }
  }
}
