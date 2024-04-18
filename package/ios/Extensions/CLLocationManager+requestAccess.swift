//
//  CLLocationManager+requestAccess.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 21.03.24.
//

import CoreLocation
import Foundation

extension CLLocationManager {
  enum AccessType {
    case whenInUse
    case always
  }

  static func requestAccess(for accessType: AccessType, _ callback: @escaping (_ status: CLAuthorizationStatus) -> Void) {
    let manager = CLLocationManager()
    let delegate = CLLocationManagerCallbackDelegate(locationManager: manager, callback: callback)
    manager.delegate = delegate
    switch accessType {
    case .whenInUse:
      manager.requestWhenInUseAuthorization()
    case .always:
      manager.requestAlwaysAuthorization()
    }
  }

  private class CLLocationManagerCallbackDelegate: GlobalReferenceHolder, CLLocationManagerDelegate {
    private let locationManager: CLLocationManager
    private let callback: (_ status: CLAuthorizationStatus) -> Void

    init(locationManager: CLLocationManager, callback: @escaping (_ status: CLAuthorizationStatus) -> Void) {
      self.locationManager = locationManager
      self.callback = callback
      super.init()
      makeGlobal()
    }

    private var authorizationStatus: CLAuthorizationStatus {
      if #available(iOS 14.0, *) {
        return locationManager.authorizationStatus
      } else {
        return CLLocationManager.authorizationStatus()
      }
    }

    func locationManagerDidChangeAuthorization(_: CLLocationManager) {
      if authorizationStatus == .notDetermined {
        // This method is called once on init with status "notDetermined", ignore the first call.
        return
      }

      removeGlobal()
      callback(authorizationStatus)
    }
  }
}
