//
//  CameraView+FocusDepth.swift
//  VisionCamera
//
//  Created by Hugo Gresse on 12.08.25.
//

import AVFoundation
import Foundation

extension CameraView {
  func focusDepth(distance: Float, promise: Promise) {
    withPromise(promise) {
      try cameraSession.focusDepth(distance: distance)
      return nil
    }
  }
}
