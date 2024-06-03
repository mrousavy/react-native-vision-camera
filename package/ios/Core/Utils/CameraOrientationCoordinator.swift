//
//  CameraOrientationCoordinator.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import Foundation

// MARK: - CameraOrientationCoordinator

protocol CameraOrientationCoordinator {
  var previewRotation: Double { get }
  var outputRotation: Double { get }

  func setDelegate(_ delegate: CameraOrientationCoordinatorDelegate)
}

// MARK: - CameraOrientationCoordinatorDelegate

protocol CameraOrientationCoordinatorDelegate: AnyObject {
  func onPreviewRotationChanged(rotationAngle: Double)
  func onOutputRotationChanged(rotationAngle: Double)
}
