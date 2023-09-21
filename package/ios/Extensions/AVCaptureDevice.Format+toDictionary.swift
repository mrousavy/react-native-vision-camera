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

  func toDictionary() -> [String: Any] {
    let availablePixelFormats = AVCaptureVideoDataOutput().availableVideoPixelFormatTypes
    let pixelFormats = availablePixelFormats.map { format in PixelFormat(mediaSubType: format) }

    return [
      "videoStabilizationModes": videoStabilizationModes.map(\.descriptor),
      "autoFocusSystem": autoFocusSystem.descriptor,
      "photoHeight": highResolutionStillImageDimensions.height,
      "photoWidth": highResolutionStillImageDimensions.width,
      "videoHeight": videoDimensions.height,
      "videoWidth": videoDimensions.width,
      "maxISO": maxISO,
      "minISO": minISO,
      "fieldOfView": videoFieldOfView,
      "maxZoom": videoMaxZoomFactor,
      "supportsVideoHDR": isVideoHDRSupported,
      "supportsPhotoHDR": false,
      "minFps": minFrameRate,
      "maxFps": maxFrameRate,
      "pixelFormats": pixelFormats.map(\.unionValue),
      "supportsDepthCapture": !supportedDepthDataFormats.isEmpty,
    ]
  }
}
