//
//  AVCaptureConnection+setInterfaceOrientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 26.07.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension AVCaptureConnection {
  /**
   Sets the `videoOrientation` to the given `orientation` if video orientation setting is supported.
   */
  func setInterfaceOrientation(_ orientation: UIInterfaceOrientation) {
    if isVideoOrientationSupported {
      switch orientation {
      case .portrait:
        videoOrientation = .portrait
      case .portraitUpsideDown:
        videoOrientation = .portraitUpsideDown
      case .landscapeLeft:
        videoOrientation = .landscapeLeft
      case .landscapeRight:
        videoOrientation = .landscapeRight
      case .unknown:
        fallthrough
      @unknown default:
        videoOrientation = .portrait
      }
    }
  }
}
