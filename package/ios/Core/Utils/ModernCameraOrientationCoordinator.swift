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

  var previewRotation: Double {
    return rotationCoordinator.videoRotationAngleForHorizonLevelPreview
  }

  var outputRotation: Double {
    return rotationCoordinator.videoRotationAngleForHorizonLevelCapture
  }

  init(device: AVCaptureDevice, previewLayer: CALayer?) {
    rotationCoordinator = AVCaptureDevice.RotationCoordinator(device: device, previewLayer: previewLayer)

    // Observe Preview Rotation
    previewObserver = rotationCoordinator.observe(\.videoRotationAngleForHorizonLevelPreview) { coordinator, _ in
      self.delegate?.onPreviewRotationChanged(rotationAngle: coordinator.videoRotationAngleForHorizonLevelPreview)
    }
    // Observe Output Rotation
    outputObserver = rotationCoordinator.observe(\.videoRotationAngleForHorizonLevelCapture) { coordinator, _ in
      self.delegate?.onOutputRotationChanged(rotationAngle: coordinator.videoRotationAngleForHorizonLevelCapture)
    }
  }

  func setDelegate(_ delegate: any CameraOrientationCoordinatorDelegate) {
    self.delegate = delegate
    delegate.onOutputRotationChanged(rotationAngle: outputRotation)
    delegate.onPreviewRotationChanged(rotationAngle: previewRotation)
  }
}
