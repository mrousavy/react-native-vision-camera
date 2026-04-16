///
/// HybridCameraDeviceFactory.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

class HybridCameraDeviceFactory: HybridCameraDeviceFactorySpec {
  let discoverySession: AVCaptureDevice.DiscoverySession
  var cameraDevices: [any HybridCameraDeviceSpec] {
    return discoverySession.devices.map { HybridCameraDevice(device: $0) }
  }

  override init() {
    self.discoverySession = AVCaptureDevice.DiscoverySession(
      deviceTypes: AVCaptureDevice.DeviceType.all,
      mediaType: nil,
      position: .unspecified)
    super.init()
  }

  var userPreferredCamera: (any HybridCameraDeviceSpec)? {
    get {
      guard #available(iOS 17.0, *) else {
        return nil
      }
      guard let device = AVCaptureDevice.userPreferredCamera else {
        return nil
      }
      return HybridCameraDevice(device: device)
    }
    set {
      guard #available(iOS 17.0, *) else {
        return
      }
      guard let hybridDevice = newValue as? HybridCameraDevice else {
        return
      }
      AVCaptureDevice.userPreferredCamera = hybridDevice.device
    }
  }

  func addOnCameraDevicesChangedListener(listener: @escaping ([any HybridCameraDeviceSpec]) -> Void)
    -> ListenerSubscription
  {
    // 1. Attach a listener using KVO
    let observation = discoverySession.observe(\.devices) { _, change in
      guard let newDevices = change.newValue else { return }
      logger.info("Devices changed! \(change.oldValue?.count ?? 0) -> \(newDevices.count)")
      let devices = newDevices.map { HybridCameraDevice(device: $0) }
      listener(devices)
    }

    // 2. Return a remove function that removes the listener via KVO
    return ListenerSubscription(remove: {
      observation.invalidate()
    })
  }

  func getCameraForId(id: String) -> (any HybridCameraDeviceSpec)? {
    guard let device = AVCaptureDevice(uniqueID: id) else {
      return nil
    }
    return HybridCameraDevice(device: device)
  }

  func getDefaultCamera(position: CameraPosition) throws -> (any HybridCameraDeviceSpec)? {
    let device = AVCaptureDevice.default(
      .builtInWideAngleCamera,
      for: .video,
      position: position.toAVCaptureDevicePosition())
    guard let device else {
      return nil
    }
    return HybridCameraDevice(device: device)
  }

  func getSupportedExtensions(camera: any HybridCameraDeviceSpec) throws -> Promise<
    [any HybridCameraExtensionSpec]
  > {
    // There are no Camera Extensions on iOS.
    return .resolved(withResult: [])
  }
}
