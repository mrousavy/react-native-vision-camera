//
//  TrackTimeline.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 07.06.24.
//

import Foundation
import CoreMedia

/**
 Represents the timeline of a specific track in an asset (video, audio).
 The timeline can be started and stopped, and can contain pauses inbetween.
 */
class TrackTimeline {
  private let clock: CMClock
  private var events: [Event] = []
  
  /**
   Represents whether the timeline has been marked as finished or not.
   A timeline will automatically be marked as finished when a timestamp arrives that appears after a stop().
   */
  public private(set) var isFinished: Bool = false
  
  init(withClock clock: CMClock) {
    self.clock = clock
  }
  
  var description: String {
    let mapped = events.map { $0.description }
    return mapped.joined(separator: "\n")
  }
  
  func start() {
    let now = CMClockGetTime(clock)
    events.append(Event(type: .start, timestamp: now))
  }
  
  func pause() {
    let now = CMClockGetTime(clock)
    events.append(Event(type: .pause, timestamp: now))
  }
  
  func resume() {
    let now = CMClockGetTime(clock)
    events.append(Event(type: .resume, timestamp: now))
  }
  
  func stop() {
    let now = CMClockGetTime(clock)
    events.append(Event(type: .stop, timestamp: now))
  }
  
  func isTimestampWithinTimeline(timestamp: CMTime) -> Bool {
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
          // It's before the track was started.
          return false
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
          return false
        }
      }
    }
    
    // It passed all of our checks - it's within the timeline!
    return true
  }
  
  /**
   Represents an Event inside a track timeline.
   Each event has a timestamp.
   */
  struct Event {
    let type: EventType
    let timestamp: CMTime
    
    var description: String {
      switch type {
      case .start:
        return "\(timestamp.seconds): ⏺️ Started"
      case .pause:
        return "\(timestamp.seconds): ⏸️ Paused"
      case .resume:
        return "\(timestamp.seconds): ▶️ Resumed"
      case .stop:
        return "\(timestamp.seconds): ⏹️ Stopped"
      }
    }
    
    enum EventType {
      case start
      case pause
      case resume
      case stop
    }
  }
}
