///
/// URL+createTempURL.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import UniformTypeIdentifiers

enum TemporaryFileError: Error {
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
}
