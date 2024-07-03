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

 All orientation values are relative to the given input device's native sensor orientation.
 Whenever the input device changes, make sure to update it using [setInputDevice].
 */
final class OrientationManager {
  // Whether to use device gyro data, or just UI orientation
  private var targetOutputOrientation = OutputOrientation.device
  // Gyro updates
  private let motionManager = CMMotionManager()
  private let operationQueue = OperationQueue()
  // Last cached orientations
  private var lastPreviewOrientation: Orientation?
  private var lastOutputOrientation: Orientation?

  // Orientation listener
  weak var delegate: OrientationManagerDelegate? {
    didSet {
      lastPreviewOrientation = nil
      lastOutputOrientation = nil
      maybeUpdateOrientations()
    }
  }

  // The orientation of the physical camera sensor
  private var sensorOrientation: Orientation {
    didSet {
      if oldValue != sensorOrientation {
        VisionLogger.log(level: .debug, message: "Sensor Orientation changed from \(oldValue) -> \(sensorOrientation)")
        maybeUpdateOrientations()
      }
    }
  }

  // The orientation of the UI
  private var interfaceOrientation: Orientation {
    didSet {
      if oldValue != interfaceOrientation {
        VisionLogger.log(level: .debug, message: "Interface Orientation changed from \(oldValue) -> \(interfaceOrientation)")
        maybeUpdateOrientations()
      }
    }
  }

  // The orientation of the physical device's gyro sensor/accelerometer
  private var deviceOrientation: Orientation {
    didSet {
      if oldValue != deviceOrientation {
        VisionLogger.log(level: .debug, message: "Device Orientation changed from \(oldValue) -> \(deviceOrientation)")
        maybeUpdateOrientations()
      }
    }
  }

  /**
   The orientation of the preview view.
   */
  var previewOrientation: Orientation {
    return sensorOrientation.relativeTo(orientation: interfaceOrientation)
  }

  /**
   The orientation of all outputs (photo, video, ..)
   */
  var outputOrientation: Orientation {
    if targetOutputOrientation == .preview {
      return previewOrientation
    }

    return sensorOrientation.relativeTo(orientation: deviceOrientation)
  }

  init() {
    // Default values for Orientation
    sensorOrientation = DEFAULT_SENSOR_ORIENTATION
    interfaceOrientation = Orientation(interfaceOrientation: UIApplication.shared.interfaceOrientation)
    deviceOrientation = interfaceOrientation

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

  func setInputDevice(_ device: AVCaptureDevice) {
    // All orientations here are relative to the device's native sensor orientation.
    sensorOrientation = device.sensorOrientation
  }

  func setTargetOutputOrientation(_ targetOrientation: OutputOrientation) {
    VisionLogger.log(level: .info, message: "Setting target output orientation from \(targetOutputOrientation) to \(targetOrientation)...")
    targetOutputOrientation = targetOrientation
    maybeUpdateOrientations()

    switch targetOrientation {
    case .device:
      // If we want device orientations, we start streaming using CMMotionManager.
      startDeviceOrientationListener()
    case .preview:
      // If we just want preview orientations, we don't need CMMotionManager and can stop it.
      stopDeviceOrientationListener()
    }
  }

  @objc
  private func onDeviceOrientationChanged(notification _: NSNotification) {
    // Whenever the UIDevice orientation changes, we get the current interface orientation (UI).
    // Interface orientation determines previewOrientation. This will not be called if rotation is locked in control center.
    interfaceOrientation = Orientation(interfaceOrientation: UIApplication.shared.interfaceOrientation)
  }

  private func maybeUpdateOrientations() {
    if previewOrientation != lastPreviewOrientation {
      // Preview Orientation changed!
      delegate?.onPreviewOrientationChanged(previewOrientation: previewOrientation)
      lastPreviewOrientation = previewOrientation
    }
    if outputOrientation != lastOutputOrientation {
      // Output Orientation changed!
      delegate?.onOutputOrientationChanged(outputOrientation: outputOrientation)
      lastOutputOrientation = outputOrientation
    }
  }

  private func startDeviceOrientationListener() {
    stopDeviceOrientationListener()
    if motionManager.isAccelerometerAvailable {
      motionManager.accelerometerUpdateInterval = 0.2
      motionManager.startAccelerometerUpdates(to: operationQueue) { accelerometerData, error in
        if let error {
          VisionLogger.log(level: .error, message: "Failed to get Accelerometer data! \(error)")
        }
        if let accelerometerData {
          self.deviceOrientation = accelerometerData.deviceOrientation
        }
      }
    }
  }

  private func stopDeviceOrientationListener() {
    if motionManager.isAccelerometerActive {
      motionManager.stopAccelerometerUpdates()
    }
  }
}
