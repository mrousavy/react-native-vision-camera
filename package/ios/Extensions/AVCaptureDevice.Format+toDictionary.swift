//
//  AVCaptureDevice.Format+toDictionary.swift
//  mrousavy
//
//  Created by Marc Rousavy on 15.01.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation

private func getAllVideoStabilizationModes() -> [AVCaptureVideoStabilizationMode] {
  var modes: [AVCaptureVideoStabilizationMode] = [.auto, .cinematic, .off, .standard]
  if #available(iOS 13, *) {
    modes.append(.cinematicExtended)
  }
  return modes
}

extension AVCaptureDevice.Format {
  var videoStabilizationModes: [AVCaptureVideoStabilizationMode] {
    return getAllVideoStabilizationModes().filter { self.isVideoStabilizationModeSupported($0) }
  }

  var minFrameRate: Float64 {
    let maxRange = videoSupportedFrameRateRanges.max { l, r in
      return l.maxFrameRate < r.maxFrameRate
    }
    return maxRange?.maxFrameRate ?? 0
  }

  var maxFrameRate: Float64 {
    let maxRange = videoSupportedFrameRateRanges.max { l, r in
      return l.maxFrameRate < r.maxFrameRate
    }
    return maxRange?.maxFrameRate ?? 0
  }

  var supportsVideoHDR: Bool {
    let pixelFormat = CMFormatDescriptionGetMediaSubType(formatDescription)
    let hdrFormats = [
      kCVPixelFormatType_420YpCbCr10BiPlanarFullRange,
      kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange,
      kCVPixelFormatType_Lossless_420YpCbCr10PackedBiPlanarVideoRange,
    ]
    return hdrFormats.contains(pixelFormat)
  }

  func toDictionary() -> [String: AnyHashable] {
    let availablePixelFormats = AVCaptureVideoDataOutput().availableVideoPixelFormatTypes
    let pixelFormats = availablePixelFormats.map { format in PixelFormat(mediaSubType: format) }

    return [
      "videoStabilizationModes": videoStabilizationModes.map(\.descriptor),
      "autoFocusSystem": autoFocusSystem.descriptor,
      "photoHeight": photoDimensions.height,
      "photoWidth": photoDimensions.width,
      "videoHeight": videoDimensions.height,
      "videoWidth": videoDimensions.width,
      "maxISO": maxISO,
      "minISO": minISO,
      "fieldOfView": videoFieldOfView,
      "maxZoom": videoMaxZoomFactor,
      "supportsVideoHDR": supportsVideoHDR,
      "supportsPhotoHDR": false,
      "minFps": minFrameRate,
      "maxFps": maxFrameRate,
      "pixelFormats": pixelFormats.map(\.unionValue),
      "supportsDepthCapture": !supportedDepthDataFormats.isEmpty,
    ]
  }

  /**
   Compares this format to the given JS `CameraDeviceFormat`.
   Only the most important properties (such as dimensions and FPS) are taken into consideration,
   so this is not an exact equals, but more like a "matches filter" comparison.
   */
  func isEqualTo(jsFormat dict: NSDictionary) -> Bool {
    guard dict["photoWidth"] as? Int32 == photoDimensions.width && dict["photoHeight"] as? Int32 == photoDimensions.height else {
      return false
    }

    guard dict["videoWidth"] as? Int32 == videoDimensions.width && dict["videoHeight"] as? Int32 == videoDimensions.height else {
      return false
    }

    guard dict["minFps"] as? Float64 == minFrameRate && dict["maxFps"] as? Float64 == maxFrameRate else {
      return false
    }

    guard dict["supportsVideoHDR"] as? Bool == supportsVideoHDR else {
      return false
    }

    return true
  }
}
