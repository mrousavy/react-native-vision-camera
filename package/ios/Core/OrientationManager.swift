//
//  OrientationManager.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import AVFoundation
import Foundation

class OrientationManager: CameraOrientationCoordinatorDelegate {
  private var orientationCoordinator: CameraOrientationCoordinator?
  private var targetOutputOrientation = OutputOrientation.device
  private weak var previewLayer: CALayer?
  private weak var device: AVCaptureDevice?
  private weak var delegate: CameraOrientationCoordinatorDelegate?

  /**
   The orientation of the preview view.
   */
  var previewOrientation: Orientation {
    guard let orientationCoordinator else {
      return .portrait
    }
    return orientationCoordinator.previewOrientation
  }

  /**
   The orientation of all outputs (photo, video, ..)
   */
  var outputOrientation: Orientation {
    switch targetOutputOrientation {
    case .device:
      guard let orientationCoordinator else {
        return .portrait
      }
      return orientationCoordinator.outputOrientation
    case .preview:
      return previewOrientation
    case .portrait:
      return .portrait
    case .landscapeLeft:
      return .landscapeLeft
    case .portraitUpsideDown:
      return .portraitUpsideDown
    case .landscapeRight:
      return .landscapeRight
    }
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

    orientationCoordinator?.setDelegate(self)
  }

  func setDelegate(_ delegate: CameraOrientationCoordinatorDelegate) {
    self.delegate = delegate
  }

  func setTargetOutputOrientation(_ targetOrientation: OutputOrientation) {
    if targetOutputOrientation == targetOrientation {
      // already the same
      return
    }

    targetOutputOrientation = targetOrientation
    // update delegate listener
    delegate?.onOutputOrientationChanged(outputOrientation: outputOrientation)
    delegate?.onPreviewOrientationChanged(previewOrientation: previewOrientation)
  }

  func onPreviewOrientationChanged(previewOrientation: Orientation) {
    guard let delegate else {
      return
    }
    // update delegate listener
    delegate.onPreviewOrientationChanged(previewOrientation: previewOrientation)
  }

  func onOutputOrientationChanged(outputOrientation: Orientation) {
    guard let delegate else {
      return
    }
    // update delegate listener
    delegate.onOutputOrientationChanged(outputOrientation: outputOrientation)
  }
}
