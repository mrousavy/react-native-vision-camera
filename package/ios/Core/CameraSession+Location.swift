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
    #if VISION_CAMERA_ENABLE_LOCATION
      let locationServicesEnabled = CLLocationManager.locationServicesEnabled()
      if configuration.enableLocation && locationServicesEnabled {
        let locationProvider = LocationProvider()
        guard locationProvider.hasPermission else {
          // Location permission has been denied
          throw CameraError.permission(.location)
        }

        // The object's init will start streaming locataion
        metadataProvider.locationProvider = locationProvider
      } else {
        // The object's deinit will stop streaming location
        metadataProvider.locationProvider = nil
      }
    #else
      if configuration.enableLocation {
        throw CameraError.system(.locationNotEnabled)
      }
    #endif
  }
}
