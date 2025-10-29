///
/// CameraQueues.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation

enum CameraQueues {
  static let cameraQueue = DispatchQueue(label: "mrousavy/VisionCamera.main",
                                         qos: .userInteractive,
                                         attributes: [],
                                         autoreleaseFrequency: .inherit,
                                         target: nil)
}
