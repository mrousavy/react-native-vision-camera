//
//  PhotoCaptureDelegate.swift
//  mrousavy
//
//  Created by Marc Rousavy on 15.12.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import AVFoundation

private var delegatesReferences: [NSObject] = []

// MARK: - PhotoCaptureDelegate

class PhotoCaptureDelegate: NSObject, AVCapturePhotoCaptureDelegate {
  private let promise: Promise

  required init(promise: Promise) {
    self.promise = promise
    super.init()
    delegatesReferences.append(self)
  }

  func photoOutput(_: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
    defer {
      delegatesReferences.removeAll(where: { $0 == self })
    }
    if let error = error as NSError? {
      promise.reject(error: .capture(.unknown(message: error.description)), cause: error)
      return
    }

    let error = ErrorPointer(nilLiteral: ())
    guard let tempFilePath = RCTTempFilePath("jpeg", error)
    else {
      promise.reject(error: .capture(.createTempFileError), cause: error?.pointee)
      return
    }
    let url = URL(string: "file://\(tempFilePath)")!

    guard let data = photo.fileDataRepresentation() else {
      promise.reject(error: .capture(.fileError))
      return
    }

    do {
      try data.write(to: url)
      let exif = photo.metadata["{Exif}"] as? [String: Any]
      let width = exif?["PixelXDimension"]
      let height = exif?["PixelYDimension"]
      let exifOrientation = photo.metadata[kCGImagePropertyOrientation as String] as? Int ?? 0
      let orientation = getOrientation(forExifOrientation: exifOrientation)
      let isMirrored = getIsMirrored(forExifOrientation: exifOrientation)

      promise.resolve([
        "path": tempFilePath,
        "width": width as Any,
        "height": height as Any,
        "orientation": orientation,
        "isMirrored": isMirrored,
        "isRawPhoto": photo.isRawPhoto,
        "metadata": photo.metadata,
        "thumbnail": photo.embeddedThumbnailPhotoFormat as Any,
      ])
    } catch {
      promise.reject(error: .capture(.fileError), cause: error as NSError)
    }
  }

  func photoOutput(_: AVCapturePhotoOutput, didFinishCaptureFor _: AVCaptureResolvedPhotoSettings, error: Error?) {
    defer {
      delegatesReferences.removeAll(where: { $0 == self })
    }
    if let error = error as NSError? {
      promise.reject(error: .capture(.unknown(message: error.description)), cause: error)
      return
    }
  }

  private func getOrientation(forExifOrientation exifOrientation: Int) -> String {
    switch exifOrientation {
    case 1, 2:
      return "portrait"
    case 3, 4:
      return "portrait-upside-down"
    case 5, 6:
      return "landscape-left"
    case 7, 8:
      return "landscape-right"
    default:
      return "portrait"
    }
  }

  private func getIsMirrored(forExifOrientation exifOrientation: Int) -> Bool {
    switch exifOrientation {
    case 2, 4, 5, 7:
      return true
    default:
      return false
    }
  }
}
