//
//  AVCaptureDevice.Format+dimensions.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.08.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension AVCaptureDevice.Format {
  /**
   * Returns the dimensions the video pipeline is streaming at.
   */
  var videoDimensions: CMVideoDimensions {
    return CMVideoFormatDescriptionGetDimensions(formatDescription)
  }

  /**
   Returns the maximum available photo resolution this format can use.
   */
  var photoDimensions: CMVideoDimensions {
    if #available(iOS 16.0, *) {
      if let max = supportedMaxPhotoDimensions.max(by: { left, right in
        return left.width * left.height < right.width * right.height
      }) {
        return max
      }
    }
    return highResolutionStillImageDimensions
  }
}
