///
/// UI+CameraOrientation.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension CameraOrientation {
  init(uiOrientation: UIImage.CameraOrientation) {
    switch uiOrientation {
    case .up, .upMirrored:
      self = .up
    case .down, .downMirrored:
      self = .down
    case .left, .leftMirrored:
      self = .left
    case .right, .rightMirrored:
      self = .right
    @unknown default:
      fatalError("UIImage.CameraOrientation has unknown value: \(uiOrientation)")
    }
  }
  init(interfaceOrientation: UIInterfaceOrientation) {
    switch interfaceOrientation {
    case .portrait:
      self = .up
    case .portraitUpsideDown:
      self = .down
    case .landscapeLeft:
      self = .right
    case .landscapeRight:
      self = .left
    case .unknown:
      self = .up
    @unknown default:
      fatalError("UIInterfaceOrientation has unknown value: \(interfaceOrientation)")
    }
  }

  func toUIImageOrientation(isMirrored: Bool) -> UIImage.CameraOrientation {
    switch self {
    case .up:
      return isMirrored ? .upMirrored : .up
    case .down:
      return isMirrored ? .downMirrored : .down
    case .left:
      return isMirrored ? .leftMirrored : .left
    case .right:
      return isMirrored ? .rightMirrored : .right
    }
  }
}
