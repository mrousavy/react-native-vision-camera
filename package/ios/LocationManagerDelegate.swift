//
//  LocationManagerDelegate.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 19.03.24.
//

import CoreLocation
import Foundation

// Keeps a strong reference on delegates, as the CLLocationManager only holds a weak reference.
private var delegatesReferences: [NSObject] = []

// MARK: - LocationManagerDelegate

class LocationManagerDelegate: NSObject, CLLocationManagerDelegate {
  private let promise: Promise

  init(promise: Promise) {
    self.promise = promise
    super.init()
    delegatesReferences.append(self)
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    defer {
      delegatesReferences.removeAll(where: { $0 == self })
    }

    if #available(iOS 14.0, *) {
      let status = manager.authorizationStatus.descriptor
      promise.resolve(status)
    } else {
      let status = CLLocationManager.authorizationStatus().descriptor
      promise.resolve(status)
    }
  }
}
