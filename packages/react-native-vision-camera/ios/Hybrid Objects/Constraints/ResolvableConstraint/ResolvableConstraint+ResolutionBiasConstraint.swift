///
/// ResolvableConstraint+ResolutionBiasConstraint.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import NitroModules

extension ResolutionBiasConstraint: ResolvableConstraint {
  typealias ResolvedValue = Void

  func resolve(for format: AVCaptureDevice.Format) throws(RuntimeError) -> ConstraintResolution<Void> {
    let hybridOutput = self.resolutionBias
    guard let resolutionNegotiationsParticipant = hybridOutput as? any ResolutionNegotiationParticipant else {
      throw RuntimeError.error(
        withMessage:
          "The given CameraOutput (in `resolutionBias`) does not conform to `ResolutionNegotiationParticipant`!")
    }

    let streamType = resolutionNegotiationsParticipant.streamType
    let supportedResolutions = format.supportedResolutions(for: streamType)
    let penalty: Double
    switch resolutionNegotiationsParticipant.targetResolution {
    case .closestTo(let targetResolution):
      let targetResolution = targetResolution.toCMVideoDimensions()
      guard let closestSupportedResolution = supportedResolutions.nearest(to: targetResolution) else {
        throw RuntimeError("Format \(format) does not have any available resolutions for stream type \"\(streamType)\"!")
      }
      penalty = closestSupportedResolution.penalty(targetResolution)
    case .min(let minimumResolution):
      let minimumResolution = minimumResolution.toCMVideoDimensions()
      guard let smallestPenalty = supportedResolutions.map({ $0.penalty(coveringAtLeast: minimumResolution) }).min() else {
        throw RuntimeError("Format \(format) does not have any available resolutions for stream type \"\(streamType)\"!")
      }
      penalty = smallestPenalty
    case .any:
      penalty = 0.0
    }

    return ConstraintResolution(
      penalty: ConstraintPenalty(distance: penalty),
      resolvedValue: ())
  }
}
