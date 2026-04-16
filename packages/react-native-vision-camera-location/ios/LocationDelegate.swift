//
//  LocationDelegate.swift
//  VisionCameraLocation
//
//  Created by Marc Rousavy on 05.11.25.
//

import CoreLocation
import Foundation

private struct CallbackWithID<Callback> {
  let callback: Callback
  let id: UUID
}

final class LocationDelegate: NSObject, CLLocationManagerDelegate {
  private var onLocationUpdatedListeners: [CallbackWithID<(CLLocation) -> Void>] = []
  private var onAuthorizationChangedListeners: [CallbackWithID<() -> Void>] = []

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    if let location = locations.last {
      for onLocationUpdatedListener in onLocationUpdatedListeners {
        onLocationUpdatedListener.callback(location)
      }
    }
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    print("error: \(error)")
    // TODO: Provide onError callbacks
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    for onAuthorizationChangedListener in onAuthorizationChangedListeners {
      onAuthorizationChangedListener.callback()
    }
  }

  func addOnLocationUpdatedListener(_ callback: @escaping (CLLocation) -> Void)
    -> ListenerSubscription
  {
    let id = UUID()
    let listener = CallbackWithID(callback: callback, id: id)
    self.onLocationUpdatedListeners.append(listener)

    return ListenerSubscription(remove: { [weak self] in
      guard let self else { return }
      self.onLocationUpdatedListeners.removeAll { $0.id == id }
    })
  }

  func addOnAuthorizationChangedListener(_ callback: @escaping () -> Void) -> ListenerSubscription {
    let id = UUID()
    let listener = CallbackWithID(callback: callback, id: id)
    self.onAuthorizationChangedListeners.append(listener)

    return ListenerSubscription(remove: { [weak self] in
      guard let self else { return }
      self.onAuthorizationChangedListeners.removeAll { $0.id == id }
    })
  }
}
