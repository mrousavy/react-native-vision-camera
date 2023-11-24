//
//  CameraDeviceFormat.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 13.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

/**
 A serializable representation of [AVCaptureDevice.Format]
 */
struct CameraDeviceFormat: Equatable, CustomStringConvertible {
  let videoWidth: Int
  let videoHeight: Int

  let photoWidth: Int
  let photoHeight: Int

  let minFps: Double
  let maxFps: Double

  let minISO: Float
  let maxISO: Float

  let fieldOfView: Float
  let maxZoom: Double

  let videoStabilizationModes: [VideoStabilizationMode]
  let autoFocusSystem: AutoFocusSystem

  let supportsVideoHdr: Bool
  let supportsPhotoHdr: Bool

  let pixelFormats: [PixelFormat]

  let supportsDepthCapture: Bool

  init(fromFormat format: AVCaptureDevice.Format) {
    videoWidth = Int(format.videoDimensions.width)
    videoHeight = Int(format.videoDimensions.height)
    photoWidth = Int(format.photoDimensions.width)
    photoHeight = Int(format.photoDimensions.height)
    minFps = format.minFps
    maxFps = format.maxFps
    minISO = format.minISO
    maxISO = format.maxISO
    fieldOfView = format.videoFieldOfView
    maxZoom = format.videoMaxZoomFactor
    videoStabilizationModes = format.videoStabilizationModes.map { VideoStabilizationMode(from: $0) }
    autoFocusSystem = AutoFocusSystem(fromFocusSystem: format.autoFocusSystem)
    supportsVideoHdr = format.supportsVideoHdr
    supportsPhotoHdr = format.supportsPhotoHdr
    pixelFormats = CameraDeviceFormat.getAllPixelFormats()
    supportsDepthCapture = format.supportsDepthCapture
  }

  init(jsValue: NSDictionary) throws {
    // swiftlint:disable force_cast
    videoWidth = jsValue["videoWidth"] as! Int
    videoHeight = jsValue["videoHeight"] as! Int
    photoWidth = jsValue["photoWidth"] as! Int
    photoHeight = jsValue["photoHeight"] as! Int
    minFps = jsValue["minFps"] as! Double
    maxFps = jsValue["maxFps"] as! Double
    minISO = jsValue["minISO"] as! Float
    maxISO = jsValue["maxISO"] as! Float
    fieldOfView = jsValue["fieldOfView"] as! Float
    maxZoom = jsValue["maxZoom"] as! Double
    let jsVideoStabilizationModes = jsValue["videoStabilizationModes"] as! [String]
    videoStabilizationModes = try jsVideoStabilizationModes.map { try VideoStabilizationMode(jsValue: $0) }
    let jsAutoFocusSystem = jsValue["autoFocusSystem"] as! String
    autoFocusSystem = try AutoFocusSystem(jsValue: jsAutoFocusSystem)
    supportsVideoHdr = jsValue["supportsVideoHdr"] as! Bool
    supportsPhotoHdr = jsValue["supportsPhotoHdr"] as! Bool
    let jsPixelFormats = jsValue["pixelFormats"] as! [String]
    pixelFormats = try jsPixelFormats.map { try PixelFormat(jsValue: $0) }
    supportsDepthCapture = jsValue["supportsDepthCapture"] as! Bool
    // swiftlint:enable force_cast
  }

  func isEqualTo(format other: AVCaptureDevice.Format) -> Bool {
    let other = CameraDeviceFormat(fromFormat: other)
    return self == other
  }

  func toJSValue() -> NSDictionary {
    return [
      "videoStabilizationModes": videoStabilizationModes.map(\.jsValue),
      "autoFocusSystem": autoFocusSystem.jsValue,
      "photoHeight": photoHeight,
      "photoWidth": photoWidth,
      "videoHeight": videoHeight,
      "videoWidth": videoWidth,
      "minISO": minISO,
      "maxISO": maxISO,
      "fieldOfView": fieldOfView,
      "maxZoom": maxZoom,
      "supportsVideoHdr": supportsVideoHdr,
      "supportsPhotoHdr": supportsPhotoHdr,
      "minFps": minFps,
      "maxFps": maxFps,
      "pixelFormats": pixelFormats.map(\.jsValue),
      "supportsDepthCapture": supportsDepthCapture,
    ]
  }

  var description: String {
    return "\(photoWidth)x\(photoHeight) | \(videoWidth)x\(videoHeight)@\(maxFps) (ISO: \(minISO)..\(maxISO), Pixel Formats: \(pixelFormats))"
  }

  // On iOS, all PixelFormats are always supported for every format (it can convert natively)
  private static func getAllPixelFormats() -> [PixelFormat] {
    let availablePixelFormats = AVCaptureVideoDataOutput().availableVideoPixelFormatTypes
    return availablePixelFormats.map { format in PixelFormat(mediaSubType: format) }
  }
}
