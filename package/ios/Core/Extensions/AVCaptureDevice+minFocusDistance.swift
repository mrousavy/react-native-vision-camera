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
   * The minimum distance this device can focus to, in centi-meters.
   */
  var minFocusDistance: Double {
    guard #available(iOS 15.0, *), minimumFocusDistance > 0 else {
      // focus distance is unknown/unavailable
      return 0
    }

    // convert from millimeters to centimeters
    return Double(minimumFocusDistance) / 10
  }
}
