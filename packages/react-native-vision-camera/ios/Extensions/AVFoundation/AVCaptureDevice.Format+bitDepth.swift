//
//  AVCaptureDevice.Format+bitDepth.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 08.04.26.
//

import AVFoundation
import CoreMedia

extension AVCaptureDevice.Format {
  var bitDepth: DynamicRangeBitDepth {
    let pixelFormat = self.formatDescription.mediaSubType
    switch pixelFormat {
    case .yuv4208BitVideo, .yuv4208BitFull, .yuv4228BitVideo, .yuv4228BitFull:
      return .sdr8Bit
    case .yuv42010BitVideo, .yuv42010BitFull, .yuv42210BitVideo, .yuv42210BitFull:
      return .hdr10Bit
    default:
      return .unknown
    }
  }
}
