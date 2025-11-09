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
    // TODO: Use our own queue here?
    self.queue = queue
  }

  func configure(config: CameraDeviceConfiguration) throws -> Promise<Void> {
    return Promise.parallel(self.queue) {
      // 1. Lock device for change
      let device = self.captureDevice
      try device.lockForConfiguration()
      defer { device.unlockForConfiguration() }

      // 2. Change all configs
      if let zoom = config.zoom, device.videoZoomFactor != zoom {
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
      // TODO: Do other props in config
    }
  }

  private func withLock<T>(_ closure: () throws -> T) throws -> T {
    try self.captureDevice.lockForConfiguration()
    defer { self.captureDevice.unlockForConfiguration() }
    return try closure()
  }

  func setFocusPoint(point: Point) throws -> Promise<Void> {
    throw RuntimeError.error(withMessage: "Focusing to a point is not yet supported.")
  }

  func setFocusRect(rect: Rect) throws -> Promise<Void> {
    throw RuntimeError.error(withMessage: "Focusing to a rect is not yet supported.")
  }

  func setFocusLensPosition(lensPosition: Double) throws -> Promise<Void> {
    return Promise.parallel(queue) {
      return try self.withLock {
        self.captureDevice.setFocusModeLocked(lensPosition: Float(lensPosition))
      }
    }
  }

  func setExposurePoint(point: Point) throws -> Promise<Void> {
    throw RuntimeError.error(withMessage: "Focusing exposure to a point is not yet supported.")
  }

  func setExposureRect(rect: Rect) throws -> Promise<Void> {
    throw RuntimeError.error(withMessage: "Focusing exposure to a rect is not yet supported.")
  }

  func setExposureBias(exposure: Double) throws -> Promise<Void> {
    return Promise.parallel(queue) {
      return try self.withLock {
        self.captureDevice.setExposureTargetBias(Float(exposure))
      }
    }
  }

  func setExposureLocked(duration: Double, iso: Double) throws -> Promise<Void> {
    return Promise.parallel(queue) {
      return try self.withLock {
        let time = CMTime(seconds: duration, preferredTimescale: 1_000_000)
        self.captureDevice.setExposureModeCustom(duration: time, iso: Float(iso))
      }
    }
  }

  func enableTorch(level: Double) throws -> Promise<Void> {
    return Promise.parallel(queue) {
      return try self.withLock {
        try self.captureDevice.setTorchModeOn(level: Float(level))
      }
    }
  }

  func startZoomAnimation(zoom: Double, rate: Double) throws -> Promise<Void> {
    return Promise.parallel(queue) {
      return try self.withLock {
        self.captureDevice.ramp(toVideoZoomFactor: zoom, withRate: Float(rate))
      }
    }
  }

  func cancelZoomAnimation() throws -> Promise<Void> {
    return Promise.parallel(queue) {
      return try self.withLock {
        self.captureDevice.cancelVideoZoomRamp()
      }
    }
  }


  func setWhiteBalanceLocked(whiteBalanceGains: WhiteBalanceGains) throws -> Promise<Void> {
    return Promise.parallel(queue) {
      return try self.withLock {
        let values = AVCaptureDevice.WhiteBalanceGains(redGain: Float(whiteBalanceGains.redGain),
                                                       greenGain: Float(whiteBalanceGains.greenGain),
                                                       blueGain: Float(whiteBalanceGains.blueGain))
        self.captureDevice.setWhiteBalanceModeLocked(with: values)
      }
    }
  }
}
