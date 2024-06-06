//
//  ClockSession.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 07.06.24.
//

import Foundation
import AVFoundation

/**
 A session for maintaining buffer timestamps using a session clock.
 */
class ClockSession {
  private let clock: CMClock
  // The timestamp when the session was initially started at. anything before that will not be recorded
  private var startTimestamp: CMTime?
  // The timestamp when a resume() was called. anything before that will not be recorded
  private var resumeTimestamp: CMTime?
  // The timestamp when a pause() was called. anything after that will not be recorded
  private var pauseTimestamp: CMTime?
  // The timestamp when the session was requested to be fully stopped at. anything after that will not be recorded
  private var stopTimestamp: CMTime?
  // The timestamp when the most recent audio/video Frame was written at
  private var lastWrittenTimestamp: CMTime?
  
  /**
   Get the total duration of the session.
   */
  var duration: Double {
    guard let lastWrittenTimestamp = lastWrittenTimestamp,
          let startTimestamp = startTimestamp else {
      return 0.0
    }
    return (lastWrittenTimestamp - startTimestamp).seconds
  }
  
  /**
   Gets whether the last frame has been written and the session is marked as finished
   */
  public private(set) var isFinished: Bool = false
  
  init(clock: CMClock) {
    self.clock = clock
  }
  
  func start() {
    assert(startTimestamp == nil, "Cannot start ClockSession twice!")
    
    let now = CMClockGetTime(clock)
    startTimestamp = now
    VisionLogger.log(level: .info, message: "ClockSession started at \(now.seconds).")
  }
  
  func stop() {
    assert(stopTimestamp == nil, "Cannot stop ClockSession twice!")
    
    let now = CMClockGetTime(clock)
    stopTimestamp = now
    VisionLogger.log(level: .info, message: "ClockSession stopped at \(now.seconds).")
  }
  
  func pause() {
    let now = CMClockGetTime(clock)
    pauseTimestamp = now
    resumeTimestamp = nil
    VisionLogger.log(level: .info, message: "ClockSession paused at \(now.seconds).")
  }
  
  func resume() {
    let now = CMClockGetTime(clock)
    pauseTimestamp = nil
    resumeTimestamp = now
    VisionLogger.log(level: .info, message: "ClockSession resumed at \(now.seconds).")
  }
  
  func isTimestampWithinTimeline(timestamp: CMTime) -> Bool {
    guard let startTimestamp else {
      // there was no start timestamp yet. frame is not within range!
      return false
    }
    
    if let stopTimestamp, timestamp >= stopTimestamp {
      // the timestamp is after we requested stop - we can mark this as finished now!
      isFinished = true
    }
    
    if timestamp <= startTimestamp {
      // the timestamp is before our initial start point.
      return false
    }
    if let stopTimestamp, timestamp >= stopTimestamp {
      // the timestamp is after we requested a stop.
      return false
    }
    if let pauseTimestamp, timestamp >= pauseTimestamp {
      // the timestamp is after we requested a pause.
      return false
    }
    if let resumeTimestamp, timestamp <= resumeTimestamp {
      // the timestamp is before we requested a resume. (so still in a pause)
      return false
    }
    
    // we're within all 4 of our boundaries, return yes
    lastWrittenTimestamp = timestamp
    return true
  }
}
