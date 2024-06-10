//
//  CMTime+inverted.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 08.06.24.
//

import CoreMedia
import Foundation

extension CMTime {
  /**
   Inverts the time.
   e.g. 3.5 seconds -> -3.5 seconds
   */
  func inverted() -> CMTime {
    return CMTime(value: value * -1, timescale: timescale)
  }
}
