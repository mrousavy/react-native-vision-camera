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
  
  var didWriteLastFrame: Bool {
    guard let lastWrittenTimestamp,
          let stopTimestamp else {
      return false
    }
    
    // TODO: This can never happen.
    return lastWrittenTimestamp >= stopTimestamp
  }
  
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
    guard let startTimestamp, timestamp >= startTimestamp else {
      // start timestamp is mandatory, guard
      return false
    }
    if let stopTimestamp, timestamp >= stopTimestamp {
      // if there is a stop timestamp, make sure we're not past that
      return false
    }
    if let pauseTimestamp, timestamp >= pauseTimestamp {
      // if there is a pause timestamp, make sure we're not past that
      return false
    }
    if let resumeTimestamp, timestamp <= resumeTimestamp {
      // if there is a resume timestamp, make sure we're not before that
      return false
    }
    
    // we're within all 4 of our boundaries, return yes
    return true
  }
  
  func didWriteFrame(withTimestamp timestamp: CMTime) {
    lastWrittenTimestamp = timestamp
  }
}
