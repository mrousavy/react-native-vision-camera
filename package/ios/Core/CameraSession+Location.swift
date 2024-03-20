//
//  CameraSession+Location.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 19.03.24.
//

import CoreLocation
import Foundation

extension CameraSession {
  func configureLocationOutput(configuration: CameraConfiguration) throws {
    if configuration.enableLocation {
      let locationProvider = LocationProvider()
      guard locationProvider.hasPermission else {
        // Location permission has been denied
        throw CameraError.permission(.location)
      }

      // The object's init will start streaming locataion
      self.metadataProvider.locationProvider = locationProvider
    } else {
      // The object's deinit will stop streaming location
      self.metadataProvider.locationProvider = nil
    }
  }
}
