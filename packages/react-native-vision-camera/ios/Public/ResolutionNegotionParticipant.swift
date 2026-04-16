//
//  ResolutionNegotionParticipant.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 08.04.26.
//

public enum StreamType {
  case video
  case photo
  case depthVideo
  case depthPhoto
}

// TODO: Do we want a flag that specifies aspect ratio and width/height rule? Maybe some things want to ignore order of width/height?
public indirect enum ResolutionRule {
  case closestTo(Size)
  case min(Size)
  case any
}

/// Represents a Camera Output that participates in resolution
/// negotiations.
///
/// The desired target resolution is accessed when negotiating
/// resolutions across all outputs conforming to the
/// `ResolutionNegotionParticipant` protocol.
///
/// This is required for using a Resolution Bias Constraint
/// for the given Camera Output, so the Camera pipeline can
/// internally figure out a most suitable resolution for all
/// outputs.
public protocol ResolutionNegotionParticipant {
  /**
   * Get the target Resolution of this `ResolutionNegotionParticipant`.
   * This will be used for finding a suitable Format and negotiated
   * between other `ResolutionNegotionParticipant`, possibly influenced
   * by Resolution Bias Constraints.
   */
  var targetResolution: ResolutionRule { get }

  /**
   * Represents the stream type the `targetResolution`
   * specifies.
   */
  var streamType: StreamType { get }
}
