///
/// URL+createTempURL.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import UniformTypeIdentifiers

enum TemporaryFileError: Error {
  case invalidAVFileType
  case fileTypeHasNoFileExtension
}

extension URL {
  /**
   * Creates a temporary file `URL` of the given `fileType`
   * in the temporary directory using a random `UUID` as its name.
   */
  static func createTempURL(fileType: UTType) throws(TemporaryFileError) -> URL {
    guard fileType.preferredFilenameExtension != nil else {
      throw TemporaryFileError.fileTypeHasNoFileExtension
    }
    let tempDirectory = FileManager.default.temporaryDirectory
    let fileName = UUID().uuidString
    return tempDirectory.appendingPathComponent(fileName, conformingTo: fileType)
  }

  /**
   * Creates a temporary file `URL` of the given AV `fileType`
   * in the temporary directory using a random `UUID` as its name.
   */
  static func createTempURL(fileType: AVFileType) throws(TemporaryFileError) -> URL {
    // AVFileType is a string-like type (usually MIME, like "video/mp4")
    let mimeType = fileType.rawValue
    guard let utFileType = UTType(mimeType: mimeType) else {
      throw TemporaryFileError.invalidAVFileType
    }
    return try createTempURL(fileType: utFileType)
  }
}
