///
/// CG+Size.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension Size {
  init(_ cgSize: CGSize) {
    self.init(width: cgSize.width, height: cgSize.height)
  }
}
