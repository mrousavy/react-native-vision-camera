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

enum TrackType: String {
  case audio
  case video
}

// MARK: - Track

final class Track {
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
   * Get whether the track is currently paused or not.
   */
  var isPaused: Bool {
    return timeline.isPaused
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
  var duration: CMTime {
    return timeline.actualDuration
  }

  /**
   Returns the last timestamp that was actually written to the track.
   */
  private(set) var lastTimestamp: CMTime?

  /**
   Gets the natural size of the asset writer, or zero if it is not a visual track.
   */
  var size: CGSize {
    return assetWriterInput.naturalSize
  }

  init(
    ofType trackType: TrackType,
    withAssetWriterInput input: AVAssetWriterInput,
    andClock clock: CMClock
  ) {
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

  func append(buffer originalBuffer: CMSampleBuffer) throws {
    // 1. If the track is already finished (from a previous call), don't write anything.
    if timeline.isFinished {
      // Track is already finished! Don't write anything.
      return
    }

    // 2. Track is not yet finished - add the timestamp to the timeline
    let originalTimestamp = CMSampleBufferGetPresentationTimeStamp(originalBuffer)
    let shouldWrite = timeline.isTimestampWithinTimeline(timestamp: originalTimestamp)

    if shouldWrite {
      // 3. If there is a pause, we need to offset the buffers by the pause duration,
      // otherwise the video is actually frozen for the pause duration. Encoders ain't smart.
      var buffer = originalBuffer
      let pauseOffset = timeline.totalPauseDuration
      if pauseOffset.seconds > 0 {
        buffer = try originalBuffer.copyWithTimestampOffset(pauseOffset.inverted())
      }
      let timestamp = CMSampleBufferGetPresentationTimeStamp(buffer)

      // 4. Write the buffer
      if assetWriterInput.isReadyForMoreMediaData {
        // Asset Writer is ready - write the buffer!
        let successful = assetWriterInput.append(buffer)
        if successful {
          lastTimestamp = timestamp
        } else {
          // Something went wrong when writing the buffer
          logger.error(
            "Failed to write \(self.type.rawValue) buffer at \(timestamp.seconds) to track!")
          // TODO: Throw to JS?
        }
      } else {
        // Asset Writer is not ready! We have to drop this frame.
        logger.error(
          "Failed to write \(self.type.rawValue) buffer at \(timestamp.seconds) to track - the Asset Writer was not yet ready for more data!"
        )
        // TODO: Throw to JS?
      }
    }

    // 5. Check again; if the track is NOW finished, we want to finalize it.
    if timeline.isFinished {
      let diff = (timeline.actualDuration - timeline.targetDuration).seconds
      logger.info(
        "Marking \(self.type.rawValue) track as finished - target duration: \(self.timeline.targetDuration.seconds) seconds, actual duration: \(self.timeline.actualDuration.seconds) seconds (\(diff > 0 ? "\(diff) seconds longer than expected" : "\(-diff) seconds shorter than expected"))"
      )
      assetWriterInput.markAsFinished()
    }
  }
}
