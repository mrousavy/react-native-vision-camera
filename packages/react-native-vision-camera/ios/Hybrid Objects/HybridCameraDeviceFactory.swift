///
/// HybridCameraDeviceFactory.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

struct ListenerPair {
  let id: UUID
  let callback: (_ newDevices: [any HybridCameraDeviceSpec]) -> Void
}

class HybridCameraDeviceFactory: HybridCameraDeviceFactorySpec {
  
  let discoverySession: AVCaptureDevice.DiscoverySession
  var cameraDevices: [any HybridCameraDeviceSpec]

  private var observation: NSKeyValueObservation?
  private var listeners: [ListenerPair] = []

  override init() {
    // 1. Create DiscoverySession
    self.discoverySession = AVCaptureDevice.DiscoverySession(deviceTypes: AVCaptureDevice.DeviceType.all,
                                                             mediaType: nil,
                                                             position: .unspecified)
    self.cameraDevices = discoverySession.devices.map { HybridCameraDevice(device: $0) }
    super.init()

    // 2. Start observing device changes
    self.observation = discoverySession.observe(\.devices) { [weak self] _, change in
      guard let self else { return }
      guard let newDevices = change.newValue else { return }
      print("VisionCamera: Devices changed! \(change.oldValue?.count ?? 0) -> \(newDevices.count)")
      self.cameraDevices = newDevices.map { HybridCameraDevice(device: $0) }
    }
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

  func addOnCameraDevicesChangedListener(listener: @escaping ([any HybridCameraDeviceSpec]) -> Void) -> ListenerSubscription {
    // 1. Attach a listener and capture it's ID
    let id = UUID()
    let pair = ListenerPair(id: id,
                            callback: listener)
    self.listeners.append(pair)

    // 2. Return a remove function that removes the listener via ID
    return ListenerSubscription(remove: { [weak self] in
      guard let self else { return }
      self.listeners.removeAll { $0.id == id }
    })
  }
  
  func getCameraForId(id: String) -> (any HybridCameraDeviceSpec)? {
    guard let device = AVCaptureDevice(uniqueID: id) else {
      return nil
    }
    return HybridCameraDevice(device: device)
  }
  
  func getDefaultCamera(deviceType: DeviceType, position: CameraPosition, mediaType: MediaType?) throws -> (any HybridCameraDeviceSpec)? {
    let device = AVCaptureDevice.default(try deviceType.toAVCaptureDeviceDeviceType(),
                                         for: mediaType?.toAVMediaType(),
                                         position: position.toAVCaptureDevicePosition())
    guard let device else {
      return nil
    }
    return HybridCameraDevice(device: device)
  }
}
