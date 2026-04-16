///
/// EnabledConstraints.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

public struct EnabledConstraints {
  let selectedFPS: Double?
  let selectedVideoStabilizationMode: TargetStabilizationMode?
  let selectedPreviewStabilizationMode: TargetStabilizationMode?
  let selectedVideoDynamicRange: TargetDynamicRange?
}
