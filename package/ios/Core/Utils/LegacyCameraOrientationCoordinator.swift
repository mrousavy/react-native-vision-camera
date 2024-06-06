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
    NotificationCenter.default.addObserver(self,
                                           selector: #selector(onDeviceOrientationChanged),
                                           name: UIDevice.orientationDidChangeNotification,
                                           object: nil)
  }

  deinit {
    UIDevice.current.endGeneratingDeviceOrientationNotifications()
    NotificationCenter.default.removeObserver(self,
                                              name: UIDevice.orientationDidChangeNotification,
                                              object: nil)
  }

  @objc
  func onDeviceOrientationChanged(notification _: NSNotification) {
    let deviceOrientation = UIDevice.current.orientation
    let interfaceOrientation = UIApplication.shared.statusBarOrientation

    previewOrientation = Orientation(interfaceOrientation: interfaceOrientation)
    outputOrientation = Orientation(deviceOrientation: deviceOrientation)

    // Notify delegate listener
    delegate?.onOrientationChanged()
  }

  func setDelegate(_ delegate: any CameraOrientationCoordinatorDelegate) {
    self.delegate = delegate
    // Notify delegate listener
    delegate.onOrientationChanged()
  }
}
