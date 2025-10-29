///
/// HybridCameraDevice.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraDevice: HybridCameraDeviceSpec {
  let device: AVCaptureDevice
  var id: String {
    return device.uniqueID
  }
  var physicalDevices: [PhysicalCameraDeviceType] {
    // TODO: Physical Devices
    return []
  }
  var position: CameraPosition {
    // TODO: position
    return .back
  }
  var deviceName: String {
    return device.localizedName
  }
  var hasFlash: Bool {
    return device.hasFlash
  }
  var formats: [any HybridCameraFormatSpec]

  init(device: AVCaptureDevice) {
    self.device = device
    self.formats = device.formats.map { HybridCameraFormat(format: $0) }
  }
}
