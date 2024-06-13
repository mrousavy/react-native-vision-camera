//
//  LegacyCameraOrientationCoordinator.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import AVFoundation
import CoreMotion
import Foundation
import UIKit

class LegacyCameraOrientationCoordinator: CameraOrientationCoordinator {
  private weak var delegate: CameraOrientationCoordinatorDelegate?
  private let sensorOrientation: Orientation
  private let motionManager = CMMotionManager()
  private let operationQueue = OperationQueue()

  var previewOrientation: Orientation = .portrait
  var outputOrientation: Orientation = .portrait

  init(device: AVCaptureDevice) {
    sensorOrientation = device.sensorOrientation
    startMonitoringDeviceOrientation()
    UIDevice.current.beginGeneratingDeviceOrientationNotifications()
    NotificationCenter.default.addObserver(self,
                                           selector: #selector(onDeviceOrientationChanged),
                                           name: UIDevice.orientationDidChangeNotification,
                                           object: nil)
    let deviceOrientation = UIDevice.current.orientation
    let interfaceOrientation = UIApplication.shared.statusBarOrientation
    previewOrientation = Orientation(interfaceOrientation: interfaceOrientation).rotatedBy(orientation: sensorOrientation)
    outputOrientation = Orientation(deviceOrientation: deviceOrientation).rotatedBy(orientation: sensorOrientation)
  }

  deinit {
    stopMonitoringDeviceOrientation()
    UIDevice.current.endGeneratingDeviceOrientationNotifications()
    NotificationCenter.default.removeObserver(self,
                                              name: UIDevice.orientationDidChangeNotification,
                                              object: nil)
  }

  func startMonitoringDeviceOrientation() {
    if motionManager.isAccelerometerAvailable {
      motionManager.accelerometerUpdateInterval = 0.2
      motionManager.startAccelerometerUpdates(to: operationQueue) { accelerometerData, _ in
        guard let accelerometerData = accelerometerData else {
          return
        }
        let acceleration = accelerometerData.acceleration
        let xNorm = abs(acceleration.x)
        let yNorm = abs(acceleration.y)
        let zNorm = abs(acceleration.z)

        // If the z-axis is greater than the other axes, the orientation does not change
        if zNorm > xNorm && zNorm > yNorm {
          return
        }

        let orientation: UIDeviceOrientation
        if xNorm > yNorm {
          orientation = acceleration.x > 0 ? .landscapeRight : .landscapeLeft
        } else {
          orientation = acceleration.y > 0 ? .portraitUpsideDown : .portrait
        }
        self.outputOrientation = Orientation(deviceOrientation: orientation).rotatedBy(orientation: self.sensorOrientation)
        self.delegate?.onOrientationChanged()
      }
    }
  }

  func stopMonitoringDeviceOrientation() {
    if motionManager.isAccelerometerActive {
      motionManager.stopAccelerometerUpdates()
    }
  }

  @objc
  func onDeviceOrientationChanged(notification _: NSNotification) {
    let interfaceOrientation = UIApplication.shared.statusBarOrientation
    previewOrientation = Orientation(interfaceOrientation: interfaceOrientation).rotatedBy(orientation: sensorOrientation)
    delegate?.onOrientationChanged()
  }

  func setDelegate(_ delegate: any CameraOrientationCoordinatorDelegate) {
    self.delegate = delegate
    // Notify delegate listener
    delegate.onOrientationChanged()
  }
}
