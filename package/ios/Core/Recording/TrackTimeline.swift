//
//  TrackTimeline.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 07.06.24.
//

import CoreMedia
import Foundation

/**
 Represents the timeline of a specific track in an asset (video, audio).
 The timeline can be started and stopped, and can contain pauses inbetween.

 The [TrackTimeline] assumes that all timestamps passed to [isTimestampWithinTimeline]
 are ordered incrementally, and once a timestamp arrives after a timeline has been stopped,
 it will mark the track as finished (see [isFinished])
 */
class TrackTimeline {
  private let trackType: TrackType
  private let clock: CMClock
  private var events: [TimelineEvent] = []

  /**
   Represents whether the timeline has been marked as finished or not.
   A timeline will automatically be marked as finished when a timestamp arrives that appears after a stop().
   */
  public private(set) var isFinished: Bool = false

  /**
   Gets the latency of the buffers in this timeline.
   This is computed by (currentTime - mostRecentBuffer.timestamp)
   */
  public private(set) var latency: CMTime = .zero

  /**
   Get the first actually written timestamp of this timeline
   */
  public private(set) var firstTimestamp: CMTime?
  /**
   Get the last actually written timestamp of this timeline.
   */
  public private(set) var lastTimestamp: CMTime?

  init(ofTrackType type: TrackType, withClock clock: CMClock) {
    trackType = type
    self.clock = clock
  }

  var targetDuration: Double {
    guard let first = events.first,
          let last = events.last else {
      return 0.0
    }
    return last.timestamp.seconds - first.timestamp.seconds - totalPauseDuration
  }

  var actualDuration: Double {
    guard let firstTimestamp, let lastTimestamp else {
      return 0.0
    }
    return lastTimestamp.seconds - firstTimestamp.seconds - totalPauseDuration
  }

  var pauses: [CMTime] {
    var result: [CMTime] = []
    var currentPauseStart: CMTime?
    for event in events {
      switch event.type {
      case .pause:
        currentPauseStart = event.timestamp
      case .resume:
        if let currentPauseStart {
          let currentPauseDuration = CMTimeSubtract(event.timestamp, currentPauseStart)
          result.append(currentPauseDuration)
        }
      default:
        break
      }
    }
    return result
  }

  var totalPauseDuration: Double {
    return pauses.reduce(0.0) { current, next in
      return current + next.seconds
    }
  }

  var description: String {
    let mapped = events.map(\.description)
    return mapped.joined(separator: "\n")
  }

  func start() {
    let now = CMClockGetTime(clock)
    events.append(TimelineEvent(type: .start, timestamp: now))
    VisionLogger.log(level: .info, message: "Requesting \(trackType) timeline start at \(now.seconds)...")
  }

  func pause() {
    let now = CMClockGetTime(clock)
    events.append(TimelineEvent(type: .pause, timestamp: now))
    VisionLogger.log(level: .info, message: "Pausing \(trackType) timeline at \(now.seconds)...")
  }

  func resume() {
    let now = CMClockGetTime(clock)
    events.append(TimelineEvent(type: .resume, timestamp: now))
    VisionLogger.log(level: .info, message: "Resuming \(trackType) timeline at \(now.seconds)...")
  }

  func stop() {
    let now = CMClockGetTime(clock)
    events.append(TimelineEvent(type: .stop, timestamp: now))
    VisionLogger.log(level: .info, message: "Requesting \(trackType) timeline stop at \(now.seconds)...")
  }

  func isTimestampWithinTimeline(timestamp: CMTime) -> Bool {
    let now = CMClockGetTime(clock)
    latency = CMTimeSubtract(now, timestamp)

    let result = isTimestampWithinTimelineImpl(timestamp)
    if result {
      if firstTimestamp == nil {
        VisionLogger.log(level: .info, message: "\(trackType) Timeline: First timestamp: \(timestamp.seconds)")
        firstTimestamp = timestamp
      }
      lastTimestamp = timestamp
    }
    return result
  }

  private func isTimestampWithinTimelineImpl(_ timestamp: CMTime) -> Bool {
    if isFinished {
      // The track is already finished. It cannot be in the timeline anymore.
      return false
    }

    // Iterate through timeline to make sure the timestamp is within our
    // total range (start - stop), and outside of any pauses.
    var isPaused = false
    for event in events {
      switch event.type {
      case .start:
        if timestamp < event.timestamp {
          // If it's before a session has been started we want to encode it in the video.
          // It will not appear if it is actually before the session start time, but we still encode it
          // to prevent blank frame flashes.
          return true
        }
      case .pause:
        isPaused = true
      case .resume:
        if isPaused && timestamp < event.timestamp {
          // It's within a pause.
          return false
        }
        isPaused = false
      case .stop:
        if timestamp > event.timestamp {
          // It's after the track was stopped. Mark this track as finished now.
          isFinished = true
          let diff = CMTimeSubtract(timestamp, event.timestamp)
          VisionLogger.log(level: .info, message: "Last timestamp arrived at \(timestamp.seconds) " +
            "(\(diff.seconds) seconds after stop()) - \(trackType) Timeline is now finished!")
          return false
        }
      }
    }

    if isPaused {
      // No resume was called, it's still paused!
      return false
    }

    // It passed all of our checks - it's within the timeline!
    return true
  }
}
