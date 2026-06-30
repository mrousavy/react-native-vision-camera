///
/// HybridCameraDeviceFactory.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

final class HybridCameraDeviceFactory: HybridCameraDeviceFactorySpec {
  override init() {
    self.discoverySession = AVCaptureDevice.DiscoverySession(
      deviceTypes: AVCaptureDevice.DeviceType.all,
      mediaType: nil,
      position: .unspecified)
    super.init()
  }

  let discoverySession: AVCaptureDevice.DiscoverySession
  var cameraDevices: [any HybridCameraDeviceSpec] {
    return discoverySession.devices.map { HybridCameraDevice(device: $0) }
  }

  var supportedMultiCamDeviceCombinations: [[any HybridCameraDeviceSpec]] {
    return discoverySession.supportedMultiCamDeviceSets.map { devices in
      return devices.map { HybridCameraDevice(device: $0) }
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
      guard let hybridDevice = newValue as? any NativeCameraDevice else {
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

  func getDefaultCamera(position: TargetCameraPosition) throws -> (any HybridCameraDeviceSpec)? {
    guard let device = getDefaultAVCaptureDevice(at: position) else {
      return nil
    }
    return HybridCameraDevice(device: device)
  }

  private func getDefaultAVCaptureDevice(at position: TargetCameraPosition) -> AVCaptureDevice? {
    switch position {
    case .back:
      // Get default wide-angle at .back
      return AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back)
    case .front:
      // Get default wide-angle at .front
      return AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front)
    case .external:
      // On iOS, Position "external" is for some reason reflected on the .deviceType, not on .position.
      return AVCaptureDevice.default(.external, for: .video, position: .unspecified)
    }
  }

  func getSupportedExtensions(camera: any HybridCameraDeviceSpec) throws -> Promise<
    [any HybridCameraExtensionSpec]
  > {
    // There are no Camera Extensions on iOS.
    return .resolved(withResult: [])
  }
}
