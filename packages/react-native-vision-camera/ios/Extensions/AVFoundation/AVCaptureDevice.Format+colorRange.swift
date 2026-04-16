//
//  AVCaptureDevice.Format+colorRange.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 08.04.26.
//

import AVFoundation
import CoreMedia

extension AVCaptureDevice.Format {
  var colorRange: ColorRange {
    let pixelFormat = self.formatDescription.mediaSubType
    switch pixelFormat {
    case .yuv4208BitVideo, .yuv42010BitVideo, .yuv4228BitVideo, .yuv42210BitVideo:
      return .video
    case .yuv4208BitFull, .yuv42010BitFull, .yuv4228BitFull, .yuv42210BitFull:
      return .full
    default:
      return .unknown
    }
  }
}
