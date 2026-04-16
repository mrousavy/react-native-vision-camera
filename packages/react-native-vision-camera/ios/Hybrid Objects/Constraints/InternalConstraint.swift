///
/// InternalConstraint.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation

enum InternalConstraint {
  case userConstraint(Constraint)
  case preferredAutoFocusSystem(AVCaptureDevice.Format.AutoFocusSystem)
  case preferHighestPhotoQuality
  case preferHighQualityPrioritization
}
