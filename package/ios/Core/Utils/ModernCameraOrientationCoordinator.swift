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
  private var device: AVCaptureDevice?

  var previewOrientation: Orientation {
    let degrees = (rotationCoordinator.videoRotationAngleForHorizonLevelPreview - getSensorOrientation().degrees + 360).truncatingRemainder(dividingBy: 360)
    return Orientation(degrees: degrees)
  }

  var outputOrientation: Orientation {
    let degrees = (rotationCoordinator.videoRotationAngleForHorizonLevelCapture - getSensorOrientation().degrees + 360).truncatingRemainder(dividingBy: 360)
    return Orientation(degrees: degrees)
  }

  init(device: AVCaptureDevice, previewLayer: CALayer?) {
    self.device = device
    rotationCoordinator = AVCaptureDevice.RotationCoordinator(device: device, previewLayer: previewLayer)

    // Observe Preview Rotation
    previewObserver = rotationCoordinator.observe(\.videoRotationAngleForHorizonLevelPreview) { [weak self] _, _ in
      if let self {
        self.delegate?.onOrientationChanged()
      }
    }
    // Observe Output Rotation
    outputObserver = rotationCoordinator.observe(\.videoRotationAngleForHorizonLevelCapture) { [weak self] _, _ in
      if let self {
        self.delegate?.onOrientationChanged()
      }
    }
  }

  func setDelegate(_ delegate: any CameraOrientationCoordinatorDelegate) {
    self.delegate = delegate
    delegate.onOrientationChanged()
  }

  private func getSensorOrientation() -> Orientation {
    let sensorOrientation: Orientation
    if let device = device {
      sensorOrientation = device.sensorOrientation
    } else {
      sensorOrientation = Orientation(degrees: 0)
    }
    return sensorOrientation
  }
}
