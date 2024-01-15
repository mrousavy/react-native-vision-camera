//
//  AVCaptureDevice+minFocusDistance.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 15.01.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension AVCaptureDevice {
  /**
   * The minimum distance this device can focus to, in meters.
   */
  var minFocusDistance: Double {
    if #available(iOS 15.0, *) {
      return Double(minFocusDistance) / 1000
    }
    return 0
  }
}
