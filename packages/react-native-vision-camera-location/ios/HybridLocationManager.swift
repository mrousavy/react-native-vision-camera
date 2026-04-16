///
/// HybridLocationManager.swift
/// VisionCameraLocation
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import CoreLocation
import NitroModules
import VisionCamera

final class HybridLocationManager: HybridLocationManagerSpec {
  private let manager = CLLocationManager()
  private let delegate = LocationDelegate()
  private var permissionPromises: [Promise<Bool>] = []
  var lastKnownLocation: (any HybridLocationSpec)? {
    guard let location = manager.location else {
      return nil
    }
    return HybridLocation(location: location)
  }

  var locationPermissionStatus: PermissionStatus {
    return PermissionStatus(clStatus: manager.authorizationStatus)
  }

  init(options: LocationManagerOptions) {
    super.init()
    manager.delegate = delegate
    manager.desiredAccuracy = options.accuracy.toCLLocationAccuracy()
    manager.distanceFilter = options.distanceFilter
    manager.pausesLocationUpdatesAutomatically = true
  }

  func requestLocationPermission() throws -> Promise<Bool> {
    if locationPermissionStatus == .authorized {
      return .resolved(withResult: true)
    }
    let promise = Promise<Bool>()
    var listener: ListenerSubscription? = nil
    listener = delegate.addOnAuthorizationChangedListener {
      let hasPermission = self.locationPermissionStatus == .authorized
      promise.resolve(withResult: hasPermission)
      listener?.remove()
    }
    manager.requestWhenInUseAuthorization()
    return promise
  }

  func startUpdating() -> Promise<Void> {
    manager.startUpdatingLocation()
    return .resolved()
  }

  func stopUpdating() -> Promise<Void> {
    manager.stopUpdatingLocation()
    return .resolved()
  }

  func addOnLocationChangedListener(callback: @escaping (any HybridLocationSpec) -> Void)
    -> ListenerSubscription
  {
    return delegate.addOnLocationUpdatedListener { location in
      callback(HybridLocation(location: location))
    }
  }
}
