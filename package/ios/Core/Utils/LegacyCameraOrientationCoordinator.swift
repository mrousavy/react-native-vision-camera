//
//  LegacyCameraOrientationCoordinator.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import Foundation
import UIKit

class LegacyCameraOrientationCoordinator: CameraOrientationCoordinator {
  private weak var delegate: CameraOrientationCoordinatorDelegate?

  var previewOrientation: Orientation = .portrait
  var outputOrientation: Orientation = .portrait

  init() {
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
    // By default, all Cameras are in 90deg rotation.
    // To properly rotate buffers up-right, we now need to counter-rotate by -90deg.
    orientation = orientation.rotateBy(orientation: .landscapeLeft)

    previewOrientation = orientation
    outputOrientation = orientation

    // Notify delegate listener
    delegate?.onPreviewOrientationChanged(previewOrientation: previewOrientation)
    delegate?.onOutputOrientationChanged(outputOrientation: outputOrientation)
  }

  func setDelegate(_ delegate: any CameraOrientationCoordinatorDelegate) {
    self.delegate = delegate
    delegate.onPreviewOrientationChanged(previewOrientation: previewOrientation)
    delegate.onOutputOrientationChanged(outputOrientation: outputOrientation)
  }
}
