//
//  OrientationManager.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import AVFoundation
import Foundation

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
final class OrientationManager: CameraOrientationCoordinatorDelegate {
  private var orientationCoordinator: CameraOrientationCoordinator?
  private var targetOutputOrientation = OutputOrientation.device
  private var lastPreviewOrientation: Orientation?
  private var lastOutputOrientation: Orientation?
  private weak var previewLayer: CALayer?
  private weak var device: AVCaptureDevice?

  weak var delegate: OrientationManagerDelegate?

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
      // Outputs should use whatever orientation the device is held in, even if screen-lock is on.
      guard let orientationCoordinator else {
        return .portrait
      }
      return orientationCoordinator.outputOrientation
    case .preview:
      // Outputs should use the same orientation as the preview view, which respects screen-lock.
      return previewOrientation
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
    guard let device = device else {
      return
    }

    if #available(iOS 17.0, *) {
      // On iOS 17+, we can use the new RotationCoordinator API which requires the device and optionally a preview view.
      orientationCoordinator = ModernCameraOrientationCoordinator(device: device, previewLayer: previewLayer)
    } else {
      // On iOS <17 we need to use the old UIDevice APIs and do a bit of rotations manually.
      orientationCoordinator = LegacyCameraOrientationCoordinator(device: device)
    }

    orientationCoordinator?.setDelegate(self)
  }

  func setTargetOutputOrientation(_ targetOrientation: OutputOrientation) {
    VisionLogger.log(level: .info, message: "Setting target output orientation from \(targetOutputOrientation) to \(targetOrientation)...")
    targetOutputOrientation = targetOrientation
    // update delegate listener
    onOrientationChanged()
  }

  func onOrientationChanged() {
    if lastPreviewOrientation != previewOrientation {
      // Preview orientation changed
      delegate?.onPreviewOrientationChanged(previewOrientation: previewOrientation)
      lastPreviewOrientation = previewOrientation
    }
    if lastOutputOrientation != outputOrientation {
      // Output orientation changed
      delegate?.onOutputOrientationChanged(outputOrientation: outputOrientation)
      lastOutputOrientation = outputOrientation
    }
  }
}
