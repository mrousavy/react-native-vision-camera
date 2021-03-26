//
//  PhotoCaptureDelegate.swift
//  Cuvent
//
//  Created by Marc Rousavy on 15.12.20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import AVFoundation

private var delegatesReferences: [NSObject] = []

// MARK: - PhotoCaptureDelegate

class PhotoCaptureDelegate: NSObject, AVCapturePhotoCaptureDelegate {
  // MARK: Lifecycle

  required init(promise: Promise) {
    self.promise = promise
    super.init()
    delegatesReferences.append(self)
  }

  // MARK: Internal

  func photoOutput(_: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
    defer {
      delegatesReferences.removeAll(where: { $0 == self })
    }
    if let error = error {
      return promise.reject(error: .capture(.unknown(message: error.description)), cause: error as NSError)
    }

    let error = ErrorPointer(nilLiteral: ())
    guard let tempFilePath = RCTTempFilePath("jpeg", error)
    else {
      return promise.reject(error: .capture(.createTempFileError), cause: error?.pointee)
    }
    let url = URL(string: "file://\(tempFilePath)")!

    guard let data = photo.fileDataRepresentation()
    else {
      return promise.reject(error: .capture(.fileError))
    }

    do {
      try data.write(to: url)
      let exif = photo.metadata["{Exif}"] as? [String: Any]
      let width = exif?["PixelXDimension"]
      let height = exif?["PixelYDimension"]

      return promise.resolve([
        "path": tempFilePath,
        "width": width as Any,
        "height": height as Any,
        "isRawPhoto": photo.isRawPhoto,
        "metadata": photo.metadata,
        "thumbnail": photo.embeddedThumbnailPhotoFormat as Any,
      ])
    } catch {
      return promise.reject(error: .capture(.fileError), cause: error as NSError)
    }
  }

  func photoOutput(_: AVCapturePhotoOutput, didFinishCaptureFor _: AVCaptureResolvedPhotoSettings, error: Error?) {
    defer {
      delegatesReferences.removeAll(where: { $0 == self })
    }
    if let error = error {
      return promise.reject(error: .capture(.unknown(message: error.description)), cause: error as NSError)
    }
  }

  // MARK: Private

  private let promise: Promise
}
