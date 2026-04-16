///
/// NativeCameraSessionConfig.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation

public protocol NativeCameraSessionConfig {
  var negotiatedFormat: NegotiatedFormat { get }
  var enabledConstraints: EnabledConstraints { get }
}
