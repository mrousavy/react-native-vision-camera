//
//  AVCaptureDevice.Format+toDictionary.swift
//  mrousavy
//
//  Created by Marc Rousavy on 15.01.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation

extension AVCaptureDevice.Format {
  var videoStabilizationModes: [AVCaptureVideoStabilizationMode] {
    let allModes = AVCaptureDevice.Format.getAllVideoStabilizationModes()
    return allModes.filter { self.isVideoStabilizationModeSupported($0) }
  }

  var minFps: Float64 {
    let minRange = videoSupportedFrameRateRanges.min { l, r in
      return l.minFrameRate < r.minFrameRate
    }
    return minRange?.minFrameRate ?? 0
  }

  var maxFps: Float64 {
    let maxRange = videoSupportedFrameRateRanges.max { l, r in
      return l.maxFrameRate < r.maxFrameRate
    }
    return maxRange?.maxFrameRate ?? 0
  }

  var supportsVideoHdr: Bool {
    let pixelFormat = CMFormatDescriptionGetMediaSubType(formatDescription)
    let hdrFormats = [
      kCVPixelFormatType_420YpCbCr10BiPlanarFullRange,
      kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange,
      kCVPixelFormatType_Lossy_420YpCbCr10PackedBiPlanarVideoRange,
    ]
    return hdrFormats.contains(pixelFormat)
  }

  var supportsPhotoHdr: Bool {
    // TODO: Supports Photo HDR on iOS?
    return false
  }

  var supportsDepthCapture: Bool {
    return !supportedDepthDataFormats.isEmpty
  }

  private static func getAllVideoStabilizationModes() -> [AVCaptureVideoStabilizationMode] {
    var modes: [AVCaptureVideoStabilizationMode] = [.auto, .cinematic, .off, .standard]
    if #available(iOS 13, *) {
      modes.append(.cinematicExtended)
    }
    return modes
  }
}
