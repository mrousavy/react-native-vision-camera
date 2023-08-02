//
//  AVCaptureDevice.Format+matchesFilter.swift
//  mrousavy
//
//  Created by Marc Rousavy on 15.01.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation

extension AVCaptureDevice.Format {
  /**
   * Checks whether the given filter (NSDictionary, JSON Object) matches the given AVCaptureDevice Format.
   * The `dictionary` dictionary must be of type `CameraDeviceFormat` (from `CameraDevice.d.ts`)
   */
  func matchesFilter(_ filter: NSDictionary) -> Bool {
    if let photoHeight = filter.value(forKey: "photoHeight") as? NSNumber {
      if highResolutionStillImageDimensions.height != photoHeight.intValue {
        return false
      }
    }
    if let photoWidth = filter.value(forKey: "photoWidth") as? NSNumber {
      if highResolutionStillImageDimensions.width != photoWidth.intValue {
        return false
      }
    }
    if let videoHeight = filter.value(forKey: "videoHeight") as? NSNumber {
      if videoDimensions.height != CGFloat(videoHeight.doubleValue) {
        return false
      }
    }
    if let videoWidth = filter.value(forKey: "videoWidth") as? NSNumber {
      if videoDimensions.width != CGFloat(videoWidth.doubleValue) {
        return false
      }
    }
    if let maxISO = filter.value(forKey: "maxISO") as? NSNumber {
      if self.maxISO != maxISO.floatValue {
        return false
      }
    }
    if let minISO = filter.value(forKey: "minISO") as? NSNumber {
      if self.minISO != minISO.floatValue {
        return false
      }
    }
    if let fieldOfView = filter.value(forKey: "fieldOfView") as? NSNumber {
      if videoFieldOfView != fieldOfView.floatValue {
        return false
      }
    }
    if let maxZoom = filter.value(forKey: "maxZoom") as? NSNumber {
      if videoMaxZoomFactor != CGFloat(maxZoom.doubleValue) {
        return false
      }
    }
    if let minFps = filter.value(forKey: "minFps") as? NSNumber {
      if minFrameRate != Float64(minFps.doubleValue) {
        return false
      }
    }
    if let maxFps = filter.value(forKey: "maxFps") as? NSNumber {
      if maxFrameRate != Float64(maxFps.doubleValue) {
        return false
      }
    }
    if let autoFocusSystem = filter.value(forKey: "autoFocusSystem") as? String,
       let avAutoFocusSystem = try? AVCaptureDevice.Format.AutoFocusSystem(withString: autoFocusSystem) {
      if self.autoFocusSystem != avAutoFocusSystem {
        return false
      }
    }
    if let videoStabilizationModes = filter.value(forKey: "videoStabilizationModes") as? [String] {
      let avVideoStabilizationModes = videoStabilizationModes.map { try? AVCaptureVideoStabilizationMode(withString: $0) }
      let allStabilizationModesIncluded = self.videoStabilizationModes.allSatisfy { avVideoStabilizationModes.contains($0) }
      if !allStabilizationModesIncluded {
        return false
      }
    }

    return true
  }
}
