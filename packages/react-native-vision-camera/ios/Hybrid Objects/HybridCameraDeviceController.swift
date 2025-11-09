///
/// HybridCameraDeviceController.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraDeviceController: HybridCameraDeviceControllerSpec {
  var device: any HybridCameraDeviceSpec
  private let captureDevice: AVCaptureDevice
  private let queue: DispatchQueue
  
  init(device: any HybridCameraDeviceSpec, queue: DispatchQueue) throws {
    guard let hybridDevice = device as? HybridCameraDevice else {
      throw RuntimeError.error(withMessage: "Device \"\(device)\" is not of type `HybridCameraDevice`!")
    }
    self.captureDevice = hybridDevice.device
    self.device = device
    self.queue = queue
  }
  
  func configure(zoom: Double) throws -> Promise<Void> {
    return Promise.parallel(self.queue) {
      // 1. Lock device for change
      let device = self.captureDevice
      try device.lockForConfiguration()
      defer { device.unlockForConfiguration() }
      
      // 2. Change all configs
      if device.videoZoomFactor != zoom {
        // Zoom changed!
        guard zoom >= device.minAvailableVideoZoomFactor,
              zoom <= device.maxAvailableVideoZoomFactor else {
          throw RuntimeError.error(withMessage: "Zoom is out of range! " +
                                   "(minZoom: \(device.minAvailableVideoZoomFactor), " +
                                   "maxZoom: \(device.maxAvailableVideoZoomFactor) " +
                                   "- requested zoom: \(zoom))")
        }
        device.videoZoomFactor = zoom
      }
    }
  }
}
