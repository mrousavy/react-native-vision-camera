///
/// HybridDeviceOrientationManager.swift
/// VisionCamera
/// Copyright © 2026 Marc Rousavy @ Margelo
///

import CoreMotion
import Foundation
import NitroModules

final class HybridDeviceOrientationManager: HybridOrientationManagerSpec {
  let source: OrientationSource = .device
  var currentOrientation: Orientation?
  private let motionManager = CMMotionManager()
  private let operationQueue = OperationQueue()

  override init() {
    super.init()
    motionManager.accelerometerUpdateInterval = 0.2  // 200ms
  }

  func startOrientationUpdates(onChanged: @escaping (Orientation) -> Void) throws {
    logger.info("Starting device orientation updates...")
    guard motionManager.isAccelerometerAvailable else {
      throw RuntimeError.error(
        withMessage: "Cannot listen to device orientation changes - accelerometer is not available!"
      )
    }
    if motionManager.isAccelerometerActive {
      motionManager.stopAccelerometerUpdates()
    }

    if motionManager.isAccelerometerAvailable {
      motionManager.startAccelerometerUpdates(to: operationQueue) {
        [weak self] accelerometerData, error in
        guard let self else { return }
        if let error {
          logger.error("Failed to get Accelerometer data! \(error)")
        }
        guard let accelerometerData else { return }
        guard let orientation = accelerometerData.deviceOrientation else { return }
        if self.currentOrientation != orientation {
          logger.info("Device orientation changed: \(orientation.stringValue)")
          self.currentOrientation = orientation
          onChanged(orientation)
        }
      }
    }
  }

  func stopOrientationUpdates() {
    logger.info("Stopping device orientation updates...")
    if motionManager.isAccelerometerActive {
      motionManager.stopAccelerometerUpdates()
    }
  }
}
