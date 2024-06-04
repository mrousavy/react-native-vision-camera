//
//  ModernCameraOrientationCoordinator.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import AVFoundation
import Foundation

@available(iOS 17.0, *)
class ModernCameraOrientationCoordinator: CameraOrientationCoordinator {
  private let rotationCoordinator: AVCaptureDevice.RotationCoordinator
  private weak var delegate: CameraOrientationCoordinatorDelegate?
  private var previewObserver: NSKeyValueObservation?
  private var outputObserver: NSKeyValueObservation?

  var previewOrientation: Orientation {
    let degrees = rotationCoordinator.videoRotationAngleForHorizonLevelPreview
    return Orientation(degrees: degrees)
  }

  var outputOrientation: Orientation {
    let degrees = rotationCoordinator.videoRotationAngleForHorizonLevelCapture
    return Orientation(degrees: degrees)
  }

  init(device: AVCaptureDevice, previewLayer: CALayer?) {
    rotationCoordinator = AVCaptureDevice.RotationCoordinator(device: device, previewLayer: previewLayer)

    // Observe Preview Rotation
    previewObserver = rotationCoordinator.observe(\.videoRotationAngleForHorizonLevelPreview) { [weak self] _, _ in
      if let self {
        self.delegate?.onPreviewOrientationChanged(previewOrientation: self.previewOrientation)
      }
    }
    // Observe Output Rotation
    outputObserver = rotationCoordinator.observe(\.videoRotationAngleForHorizonLevelCapture) { [weak self] _, _ in
      if let self {
        self.delegate?.onOutputOrientationChanged(outputOrientation: self.outputOrientation)
      }
    }
  }

  func setDelegate(_ delegate: any CameraOrientationCoordinatorDelegate) {
    self.delegate = delegate
    delegate.onOutputOrientationChanged(outputOrientation: outputOrientation)
    delegate.onPreviewOrientationChanged(previewOrientation: previewOrientation)
  }
}
