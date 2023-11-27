//
//  CameraView+Focus.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 12.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension CameraView {
  func focus(options: FocusOptions, promise: Promise) {
    withPromise(promise) {
      let normalizedPoint = previewView.captureDevicePointConverted(fromLayerPoint: options.point)
      let newOptions = FocusOptions(point: normalizedPoint, modes: options.modes)
      try cameraSession.focus(options: newOptions)
      return nil
    }
  }
}
