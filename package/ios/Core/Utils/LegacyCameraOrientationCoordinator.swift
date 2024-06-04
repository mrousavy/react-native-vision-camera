//
//  LegacyCameraOrientationCoordinator.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import AVFoundation
import Foundation
import UIKit

class LegacyCameraOrientationCoordinator: CameraOrientationCoordinator {
  private weak var delegate: CameraOrientationCoordinatorDelegate?
  private let sensorOrientation: Orientation

  var previewOrientation: Orientation = .portrait
  var outputOrientation: Orientation = .portrait

  init(device: AVCaptureDevice) {
    sensorOrientation = device.sensorOrientation
    UIDevice.current.beginGeneratingDeviceOrientationNotifications()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleDeviceOrientationChange),
      name: UIDevice.orientationDidChangeNotification,
      object: nil
    )
  }

  deinit {
    UIDevice.current.endGeneratingDeviceOrientationNotifications()
    NotificationCenter.default.removeObserver(self, name: UIDevice.orientationDidChangeNotification, object: nil)
  }

  @objc
  func handleDeviceOrientationChange(notification _: NSNotification) {
    let deviceOrientation = UIDevice.current.orientation

    var orientation = Orientation(deviceOrientation: deviceOrientation)
    // Once we have the device's orientation, we now need to rotate by whatever
    // value the camera sensor is rotated with (mostly landscape)
    orientation = orientation.rotateBy(orientation: sensorOrientation)

    previewOrientation = orientation
    outputOrientation = orientation

    // Notify delegate listener
    delegate?.onOrientationChanged()
  }

  func setDelegate(_ delegate: any CameraOrientationCoordinatorDelegate) {
    self.delegate = delegate
    // Notify delegate listener
    delegate.onOrientationChanged()
  }
}
