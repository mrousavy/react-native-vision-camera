//
//  CMAccelerometerData+deviceOrientation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.07.24.
//

import CoreMotion

extension CMAccelerometerData {
  /**
   Get the current device orientation from the given acceleration/gyro data, or `nil` if it is unknown.
   The orientation can only be unknown if the phone is flat, in which case it is not clear which orientation the phone is held in.
   */
  var deviceOrientation: Orientation? {
    let acceleration = acceleration
    let xNorm = acceleration.x.magnitude
    let yNorm = acceleration.y.magnitude
    let zNorm = acceleration.z.magnitude

    // If the z-axis is greater than the other axes, the phone is flat.
    if zNorm > xNorm && zNorm > yNorm {
      return nil
    }

    if xNorm > yNorm {
      if acceleration.x > 0 {
        return .right
      } else {
        return .left
      }
    } else {
      if acceleration.y > 0 {
        return .down
      } else {
        return .up
      }
    }
  }
}
