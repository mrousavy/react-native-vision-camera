//
//  CLLocationManager+requestAccess.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 21.03.24.
//

import Foundation
import CoreLocation

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
  
  private class CLLocationManagerCallbackDelegate: NSObject, CLLocationManagerDelegate {
    private static var delegateReferences: [CLLocationManagerCallbackDelegate] = []
    
    private let locationManager: CLLocationManager
    private let callback: (_ status: CLAuthorizationStatus) -> Void
    
    init(locationManager: CLLocationManager, callback: @escaping (_ status: CLAuthorizationStatus) -> Void) {
      self.locationManager = locationManager
      self.callback = callback
      super.init()
      CLLocationManagerCallbackDelegate.delegateReferences.append(self)
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        defer {
          CLLocationManagerCallbackDelegate.delegateReferences.removeAll(where: { $0 == self })
        }

        if #available(iOS 14.0, *) {
          let status = manager.authorizationStatus
          callback(status)
        } else {
          let status = CLLocationManager.authorizationStatus()
          callback(status)
        }
    }
  }
}
