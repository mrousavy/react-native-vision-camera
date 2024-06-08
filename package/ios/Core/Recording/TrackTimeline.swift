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
   If this track is a master track (e.g. a video track), this list might contain
   the timelines of following tracks (e.g. an audio track).
   
   A master track will write timestamps earlier and later than all follower tracks to ensure
   it will be the longest track in the video.
   If an audio tracak is longer than a video track, there will be white frames for the duration
   difference in the resulting .mp4/.mov. By making the master track longer, this issue is prevented.
   */
  private var followerTimelines: [TrackTimeline] = []

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
  
  var firstTimestamp: CMTime? {
    return events.first?.timestamp
  }
  
  var lastTimestamp: CMTime? {
    return events.last?.timestamp
  }

  init(ofTrackType type: TrackType, withClock clock: CMClock) {
    trackType = type
    self.clock = clock
  }

  var duration: Double {
    guard let first = events.first,
          let last = events.last else {
      return 0.0
    }
    return last.timestamp.seconds - first.timestamp.seconds
  }

  var description: String {
    let mapped = events.map(\.description)
    return mapped.joined(separator: "\n")
  }

  func start() {
    let now = CMClockGetTime(clock)
    events.append(TimelineEvent(type: .start, timestamp: now))
    VisionLogger.log(level: .info, message: "\(trackType) Timeline started at \(now.seconds).")
  }

  func pause() {
    let now = CMClockGetTime(clock)
    events.append(TimelineEvent(type: .pause, timestamp: now))
    VisionLogger.log(level: .info, message: "\(trackType) Timeline paused at \(now.seconds).")
  }

  func resume() {
    let now = CMClockGetTime(clock)
    events.append(TimelineEvent(type: .resume, timestamp: now))
    VisionLogger.log(level: .info, message: "\(trackType) Timeline resumed at \(now.seconds).")
  }

  func stop() {
    let now = CMClockGetTime(clock)
    events.append(TimelineEvent(type: .stop, timestamp: now))
    VisionLogger.log(level: .info, message: "\(trackType) Timeline stopped at \(now.seconds).")
  }
  
  /**
   Starts tracking the given timeline to make sure this timeline will always
   be longer than the given timeline.
   */
  func addFollowingTimeline(_ timeline: TrackTimeline) {
    followerTimelines.append(timeline)
  }

  func isTimestampWithinTimeline(timestamp: CMTime) -> Bool {
    if isFinished {
      // The track is already finished. It cannot be in the timeline anymore.
      return false
    }

    let now = CMClockGetTime(clock)
    latency = CMTimeSubtract(timestamp, now)

    // Iterate through timeline to make sure the timestamp is within our
    // total range (start - stop), and outside of any pauses.
    var isPaused = false
    for event in events {
      switch event.type {
      case .start:
        if timestamp < event.timestamp {
          // It's before the track was started.
          if followersHaveEarlierTimestamps(thanTimestamp: timestamp) {
            // Following timelines have even earlier timestamps - so we try to overrule them
            // and will write this one to make sure our track is longer.
            return true
          } else {
            return false
          }
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
          if followersHaveLaterTimestamps(thanTimestamp: timestamp) {
            // Following timelines have even later timestamps - so we try to overrule them
            // and will write this one to make sure our track is longer.
            return true
          } else {
            isFinished = true
            VisionLogger.log(level: .info, message: "Last timestamp arrived at \(timestamp.seconds) - \(trackType) Timeline is now finished!")
            return false
          }
        }
      }
    }

    // It passed all of our checks - it's within the timeline!
    return true
  }
  
  /**
   Returns true if any of the following-tracks have a timestamp earlier than the given timestamp.
   */
  func followersHaveEarlierTimestamps(thanTimestamp timestamp: CMTime) -> Bool {
    return followerTimelines.contains { timeline in
      guard let first = timeline.firstTimestamp else {
        return false
      }
      return first.seconds < timestamp.seconds
    }
  }
  
  /**
   Returns true if any of the following-tracks have a timestamp later than the given timestamp.
   */
  func followersHaveLaterTimestamps(thanTimestamp timestamp: CMTime) -> Bool {
    return followerTimelines.contains { timeline in
      guard let last = timeline.lastTimestamp else {
        return false
      }
      return last.seconds > timestamp.seconds
    }
  }
}
