//
//  CameraOrientationCoordinator.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import Foundation

// MARK: - CameraOrientationCoordinator

protocol CameraOrientationCoordinator {
  var previewOrientation: Orientation { get }
  var outputOrientation: Orientation { get }

  func setDelegate(_ delegate: CameraOrientationCoordinatorDelegate)
}

// MARK: - CameraOrientationCoordinatorDelegate

protocol CameraOrientationCoordinatorDelegate: AnyObject {
  func onOrientationChanged()
}
