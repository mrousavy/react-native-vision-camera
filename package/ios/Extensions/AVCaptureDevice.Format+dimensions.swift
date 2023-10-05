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
   * Returns the video dimensions, adjusted to take pixel aspect ratio and/or clean
   * aperture into account.
   *
   * Pixel aspect ratio is used to adjust the width, leaving the height alone.
   */
  var videoDimensions: CGSize {
    return CMVideoFormatDescriptionGetPresentationDimensions(formatDescription,
                                                             usePixelAspectRatio: true,
                                                             useCleanAperture: true)
  
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
