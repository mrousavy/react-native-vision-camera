//
//  TimelineEvent.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 08.06.24.
//

import CoreMedia
import Foundation

/**
 Represents an Event inside a track timeline.
 Each event has a timestamp.
 */
struct TimelineEvent {
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
