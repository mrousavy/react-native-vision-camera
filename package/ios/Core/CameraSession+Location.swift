//
//  CameraSession+Location.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 19.03.24.
//

import Foundation
import CoreLocation

extension CameraSession {
  func configureLocationOutput(configuration: CameraConfiguration) throws {
    if (configuration.enableLocation) {
      let locationOutput = LocationDataOutput()
      guard locationOutput.hasPermission else {
        // Location permission has been denied
        throw CameraError.permission(.location)
      }
      
      // The object's init will start streaming locataion
      self.locationOutput = locationOutput
    } else {
      // The object's deinit will stop streaming location
      self.locationOutput = nil
    }
  }
}
