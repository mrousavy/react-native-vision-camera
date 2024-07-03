//
//  CMAccelerometerData+deviceOrientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.07.24.
//

import CoreMotion
import Foundation

extension CMAccelerometerData {
  /**
   Get the current device orientation from the given acceleration/gyro data.
   */
  var deviceOrientation: Orientation {
    let acceleration = acceleration
    let xNorm = abs(acceleration.x)
    let yNorm = abs(acceleration.y)
    let zNorm = abs(acceleration.z)

    // If the z-axis is greater than the other axes, the phone is flat.
    if zNorm > xNorm && zNorm > yNorm {
      return .portrait
    }

    if xNorm > yNorm {
      if acceleration.x > 0 {
        return .landscapeRight
      } else {
        return .landscapeLeft
      }
    } else {
      if acceleration.y > 0 {
        return .portraitUpsideDown
      } else {
        return .portrait
      }
    }
  }
}
