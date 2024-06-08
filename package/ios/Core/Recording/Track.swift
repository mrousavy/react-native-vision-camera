//
//  Track.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 08.06.24.
//

import AVFoundation
import CoreMedia
import Foundation

// MARK: - TrackType

enum TrackType {
  case audio
  case video
}

// MARK: - Track

class Track {
  private let type: TrackType
  private let assetWriterInput: AVAssetWriterInput
  private let timeline: TrackTimeline

  /**
   Gets whether the track has been marked as finished or not.

   A track is finished when stop() was called, and a buffer with a later timestamp
   than the one from the stop() call arrives.
   */
  var isFinished: Bool {
    return timeline.isFinished
  }

  /**
   When a buffer arrives, it might arrive with a small delay - [latency] represents this delay.
   */
  var latency: CMTime {
    return timeline.latency
  }

  /**
   Gets the current total duration of the timeline.
   */
  var duration: Double {
    return timeline.actualDuration
  }
  
  /**
   Returns the last timestamp that was actually written to the track.
   */
  public private(set) var lastTimestamp: CMTime?

  /**
   Gets the natural size of the asset writer, or zero if it is not a visual track.
   */
  var size: CGSize {
    return assetWriterInput.naturalSize
  }

  init(ofType trackType: TrackType,
       withAssetWriterInput input: AVAssetWriterInput,
       andClock clock: CMClock) {
    type = trackType
    assetWriterInput = input
    timeline = TrackTimeline(ofTrackType: trackType, withClock: clock)
  }

  func start() {
    timeline.start()
  }

  func stop() {
    timeline.stop()
  }

  func pause() {
    timeline.pause()
  }

  func resume() {
    timeline.resume()
  }

  func append(buffer: CMSampleBuffer) {
    // 1. If the track is already finished (from a previous call), don't write anything.
    if timeline.isFinished {
      // Track is already finished! Don't write anything.
      return
    }

    // 2. Track is not yet finished - add the timestamp to the timeline
    let timestamp = CMSampleBufferGetPresentationTimeStamp(buffer)
    let shouldWrite = timeline.isTimestampWithinTimeline(timestamp: timestamp)

    // 3. Write the buffer
    if shouldWrite && assetWriterInput.isReadyForMoreMediaData {
      let successful = assetWriterInput.append(buffer)
      if successful {
        lastTimestamp = timestamp
      } else {
        VisionLogger.log(level: .error, message: "Failed to write \(type) buffer at \(timestamp.seconds) to track!")
      }
    } else {
      VisionLogger.log(level: .error, message: "Failed to write \(type) buffer at \(timestamp.seconds) to track - " +
        "the Asset Writer was not yet ready for more data!")
    }

    // 4. Check again; if the track is NOW finished, we want to finalize it.
    if timeline.isFinished {
      VisionLogger.log(level: .info, message: "Marking track as finished - target duration: \(timeline.targetDuration), " +
        "actual duration: \(timeline.actualDuration)")
      assetWriterInput.markAsFinished()
    }
  }
}