//
//  PhotoCaptureDelegate.swift
//  mrousavy
//
//  Created by Marc Rousavy on 15.12.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import AVFoundation

// MARK: - PhotoCaptureDelegate

class PhotoCaptureDelegate: GlobalReferenceHolder, AVCapturePhotoCaptureDelegate {
  private let promise: Promise
  private let enableShutterSound: Bool
  private let cameraSessionDelegate: CameraSessionDelegate?
  private let metadataProvider: MetadataProvider
  private let path: URL
  private let thumbnailSize: CGSize?
  private let onThumbnailReadyEvent: RCTDirectEventBlock?

  required init(promise: Promise,
                enableShutterSound: Bool,
                metadataProvider: MetadataProvider,
                path: URL,
                thumbnailSize: CGSize?,
                onThumbnailReadyEvent: RCTDirectEventBlock?,
                cameraSessionDelegate: CameraSessionDelegate?) {
    self.promise = promise
    self.enableShutterSound = enableShutterSound
    self.metadataProvider = metadataProvider
    self.path = path
    self.thumbnailSize = thumbnailSize
    self.onThumbnailReadyEvent = onThumbnailReadyEvent
    self.cameraSessionDelegate = cameraSessionDelegate
    super.init()
    makeGlobal()
  }

  func photoOutput(_: AVCapturePhotoOutput, willCapturePhotoFor _: AVCaptureResolvedPhotoSettings) {
    if !enableShutterSound {
      // disable system shutter sound (see https://stackoverflow.com/a/55235949/5281431)
      AudioServicesDisposeSystemSoundID(1108)
    }

    // onShutter(..) event
    cameraSessionDelegate?.onCaptureShutter(shutterType: .photo)
  }

  func photoOutput(_: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
    defer {
      removeGlobal()
    }

    if let error = error as NSError? {
      promise.reject(error: .capture(.unknown(message: error.description)), cause: error)
      return
    }

    generateThumbnail(from: photo)

    do {
      try FileUtils.writePhotoToFile(photo: photo,
                                     metadataProvider: metadataProvider,
                                     file: path)

      let exif = photo.metadata["{Exif}"] as? [String: Any]
      let width = exif?["PixelXDimension"]
      let height = exif?["PixelYDimension"]
      let exifOrientation = photo.metadata[String(kCGImagePropertyOrientation)] as? UInt32 ?? CGImagePropertyOrientation.up.rawValue
      let cgOrientation = CGImagePropertyOrientation(rawValue: exifOrientation) ?? CGImagePropertyOrientation.up
      let orientation = getOrientation(forExifOrientation: cgOrientation)
      let isMirrored = getIsMirrored(forExifOrientation: cgOrientation)

      promise.resolve([
        "path": path.absoluteString,
        "width": width as Any,
        "height": height as Any,
        "orientation": orientation,
        "isMirrored": isMirrored,
        "isRawPhoto": photo.isRawPhoto,
        "metadata": photo.metadata,
        "thumbnail": photo.embeddedThumbnailPhotoFormat as Any,
      ])
    } catch let error as CameraError {
      promise.reject(error: error)
    } catch {
      promise.reject(error: .capture(.unknown(message: "An unknown error occured while capturing the photo!")), cause: error as NSError)
    }
  }

  func photoOutput(_: AVCapturePhotoOutput, didFinishCaptureFor _: AVCaptureResolvedPhotoSettings, error: Error?) {
    defer {
      removeGlobal()
    }
    if let error = error as NSError? {
      if error.code == -11807 {
        promise.reject(error: .capture(.insufficientStorage), cause: error)
      } else {
        promise.reject(error: .capture(.unknown(message: error.description)), cause: error)
      }
      return
    }
  }

  private func getOrientation(forExifOrientation exifOrientation: CGImagePropertyOrientation) -> String {
    switch exifOrientation {
    case .up, .upMirrored:
      return "portrait"
    case .down, .downMirrored:
      return "portrait-upside-down"
    case .left, .leftMirrored:
      return "landscape-left"
    case .right, .rightMirrored:
      return "landscape-right"
    default:
      return "portrait"
    }
  }

  private func getIsMirrored(forExifOrientation exifOrientation: CGImagePropertyOrientation) -> Bool {
    switch exifOrientation {
    case .upMirrored, .rightMirrored, .downMirrored, .leftMirrored:
      return true
    default:
      return false
    }
  }

  private func generateThumbnail(from photo: AVCapturePhoto) {
    guard let onThumbnailReadyEvent = onThumbnailReadyEvent else {
      VisionLogger.log(level: .warning, message: "generateThumbnail: onThumbnailReadyEvent not set")
      return
    }
    // Safely get embedded thumbnail data
    guard let embeddedImageData = photo.fileDataRepresentation(),
          let src = CGImageSourceCreateWithData(embeddedImageData as CFData, nil),
          let cgThumb = CGImageSourceCreateThumbnailAtIndex(
            src,
            0,
            [
              kCGImageSourceCreateThumbnailFromImageIfAbsent: false,
              kCGImageSourceCreateThumbnailWithTransform: true,
              kCGImageSourceThumbnailMaxPixelSize: 320,
            ] as CFDictionary
          )
    else {
      VisionLogger.log(level: .warning, message: "generateThumbnail: No embedded thumbnail data available")
      return
    }
    // Create UIImage from the data with error handling
    let thumbnailImage = UIImage(cgImage: cgThumb)
    do {
      let thumbnailPath = try FileUtils.getFilePath(fileExtension: "jpg")
      try FileUtils.writeUIImageToFile(image: thumbnailImage, file: thumbnailPath, compressionQuality: 0.8)
      // Call the thumbnail callback
      onThumbnailReadyEvent([
        "path": thumbnailPath.absoluteString,
        "width": Int(thumbnailImage.size.width),
        "height": Int(thumbnailImage.size.height),
      ])
    } catch {
      VisionLogger.log(level: .error, message: "generateThumbnail: Failed to generate thumbnail: \(error.localizedDescription)")
    }
  }
}
