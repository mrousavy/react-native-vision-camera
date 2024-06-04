//
//  OrientationManager.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import AVFoundation
import Foundation

class OrientationManager {
  private var orientationCoordinator: CameraOrientationCoordinator?
  private weak var previewLayer: CALayer?
  private weak var device: AVCaptureDevice?
  private weak var delegate: CameraOrientationCoordinatorDelegate?

  var outputOrientation: Orientation {
    guard let orientationCoordinator else {
      return .portrait
    }
    return orientationCoordinator.outputOrientation
  }

  var previewOrientation: Orientation {
    guard let orientationCoordinator else {
      return .portrait
    }
    return orientationCoordinator.previewOrientation
  }

  func setInputDevice(_ device: AVCaptureDevice) {
    self.device = device
    createObserver()
  }

  func setPreviewView(_ previewView: PreviewView) {
    previewLayer = previewView.videoPreviewLayer
    createObserver()
  }

  private func createObserver() {
    if #available(iOS 17.0, *) {
      // On iOS 17+, we can use the new RotationCoordinator API which requires the device and preview view.
      guard let device = self.device else {
        // we need a capture device to create a RotationCoordinator. previewLayer is optional though
        return
      }
      orientationCoordinator = ModernCameraOrientationCoordinator(device: device, previewLayer: previewLayer)
    } else {
      // On iOS <17 we need to use the old UIDevice APIs and do a bit of rotations manually.
      orientationCoordinator = LegacyCameraOrientationCoordinator()
    }

    if let delegate {
      orientationCoordinator?.setDelegate(delegate)
    }
  }

  func setDelegate(_ delegate: CameraOrientationCoordinatorDelegate) {
    self.delegate = delegate
    orientationCoordinator?.setDelegate(delegate)
  }
}
