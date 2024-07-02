//
//  OrientationManager.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import AVFoundation
import CoreMotion
import Foundation
import UIKit

// MARK: - OrientationManagerDelegate

protocol OrientationManagerDelegate: AnyObject {
  func onPreviewOrientationChanged(previewOrientation: Orientation)
  func onOutputOrientationChanged(outputOrientation: Orientation)
}

// MARK: - OrientationManager

/**
 Provides Orientation updates to the consumer.
 The orientation updates are only pushed as long as a [delegate] is set.
 */
final class OrientationManager {
  // Whether to use device gyro data, or just UI orientation
  private var targetOutputOrientation = OutputOrientation.device
  // All orientations need to be relative to the sensor orientation
  private var sensorOrientation: Orientation = DEFAULT_SENSOR_ORIENTATION
  // Gyro updates
  private let motionManager = CMMotionManager()
  private let operationQueue = OperationQueue()

  // Orientation listener
  weak var delegate: OrientationManagerDelegate?

  /**
   The orientation of the preview view.
   */
  var previewOrientation: Orientation = .portrait {
    didSet {
      if previewOrientation != oldValue {
        delegate?.onPreviewOrientationChanged(previewOrientation: previewOrientation)
      }
    }
  }

  /**
   The orientation of all outputs (photo, video, ..)
   */
  var outputOrientation: Orientation = .portrait {
    didSet {
      if outputOrientation != oldValue {
        delegate?.onOutputOrientationChanged(outputOrientation: outputOrientation)
      }
    }
  }

  init() {
    // Start listening to UI-orientation changes
    UIDevice.current.beginGeneratingDeviceOrientationNotifications()
    NotificationCenter.default.addObserver(self,
                                           selector: #selector(onDeviceOrientationChanged),
                                           name: UIDevice.orientationDidChangeNotification,
                                           object: nil)
  }

  deinit {
    // Stop gyro updates
    stopDeviceOrientationListener()
    // Stop UI-orientation updates
    UIDevice.current.endGeneratingDeviceOrientationNotifications()
    NotificationCenter.default.removeObserver(self,
                                              name: UIDevice.orientationDidChangeNotification,
                                              object: nil)
  }

  @objc
  func onDeviceOrientationChanged(notification _: NSNotification) {
    let deviceOrientation = Orientation(deviceOrientation: UIDevice.current.orientation)
    previewOrientation = deviceOrientation.relativeTo(orientation: sensorOrientation)
  }

  func setInputDevice(_ device: AVCaptureDevice) {
    sensorOrientation = device.sensorOrientation
  }

  func setTargetOutputOrientation(_ targetOrientation: OutputOrientation) {
    VisionLogger.log(level: .info, message: "Setting target output orientation from \(targetOutputOrientation) to \(targetOrientation)...")
    targetOutputOrientation = targetOrientation
    // update delegate listener
    switch targetOrientation {
    case .device:
      startDeviceOrientationListener()
    case .preview:
      stopDeviceOrientationListener()
    }
  }

  private func startDeviceOrientationListener() {
    stopDeviceOrientationListener()
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

        let orientation: Orientation
        if xNorm > yNorm {
          orientation = acceleration.x > 0 ? .landscapeRight : .landscapeLeft
        } else {
          orientation = acceleration.y > 0 ? .portraitUpsideDown : .portrait
        }
        self.outputOrientation = orientation.relativeTo(orientation: self.sensorOrientation)
      }
    }
  }

  private func stopDeviceOrientationListener() {
    if motionManager.isAccelerometerActive {
      motionManager.stopAccelerometerUpdates()
    }
  }
}
