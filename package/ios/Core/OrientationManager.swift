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

  // Whether the output streams are mirrored
  var isOutputMirrored = false {
    didSet {
      if oldValue != isOutputMirrored {
        VisionLogger.log(level: .debug, message: "Output mirroring changed from \(oldValue) -> \(isOutputMirrored)")
        maybeUpdateOrientations()
      }
    }
  }

  // Whether the preview stream is mirrored
  private var isPreviewMirrored = false {
    didSet {
      if oldValue != isPreviewMirrored {
        VisionLogger.log(level: .debug, message: "Preview mirroring changed from \(oldValue) -> \(isPreviewMirrored)")
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
    // Start listening to UI-orientation changes
    UIDevice.current.beginGeneratingDeviceOrientationNotifications()
    sensorOrientation = DEFAULT_SENSOR_ORIENTATION
    interfaceOrientation = Orientation(interfaceOrientation: UIApplication.shared.interfaceOrientation)
    deviceOrientation = interfaceOrientation
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
    interfaceOrientation = Orientation(interfaceOrientation: UIApplication.shared.interfaceOrientation)
  }

  private func maybeUpdateOrientations() {
    if previewOrientation != lastPreviewOrientation {
      delegate?.onPreviewOrientationChanged(previewOrientation: previewOrientation)
      lastPreviewOrientation = previewOrientation
    }
    if outputOrientation != lastOutputOrientation {
      delegate?.onOutputOrientationChanged(outputOrientation: outputOrientation)
      lastOutputOrientation = outputOrientation
    }
  }

  func setInputDevice(_ device: AVCaptureDevice) {
    sensorOrientation = device.sensorOrientation
    isPreviewMirrored = device.position == .front
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

        if xNorm > yNorm {
          self.deviceOrientation = acceleration.x > 0 ? .landscapeRight : .landscapeLeft
        } else {
          self.deviceOrientation = acceleration.y > 0 ? .portraitUpsideDown : .portrait
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
