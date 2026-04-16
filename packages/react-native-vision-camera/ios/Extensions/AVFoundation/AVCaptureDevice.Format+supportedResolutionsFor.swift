//
//  AVCaptureDevice.Format+supportedResolutionsFor.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 08.04.26.
//

import AVFoundation
import CoreMedia

extension AVCaptureDevice.Format {
  private var videoDimensions: [CMVideoDimensions] {
    return [self.formatDescription.dimensions]
  }
  private var photoDimensions: [CMVideoDimensions] {
    if #available(iOS 16.0, *) {
      return self.supportedMaxPhotoDimensions
    } else {
      return [self.highResolutionStillImageDimensions]
    }
  }

  /**
   * Get all supported resolutions for the given `streamType`.
   */
  func supportedResolutions(for streamType: StreamType) -> [CMVideoDimensions] {
    switch streamType {
    case .video:
      return self.videoDimensions
    case .photo:
      return self.photoDimensions
    case .depthVideo:
      return self.supportedDepthDataFormats
        .flatMap { $0.videoDimensions }
        .withoutDuplicates()
    case .depthPhoto:
      return self.supportedDepthDataFormats
        .flatMap { $0.photoDimensions }
        .withoutDuplicates()
    }
  }
}
