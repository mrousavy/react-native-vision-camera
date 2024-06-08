//
//  Track.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 08.06.24.
//

import Foundation
import AVFoundation
import CoreMedia

class Track {
  private let assetWriterInput: AVAssetWriterInput
  private let timeline: TrackTimeline
  
  var isFinished: Bool {
    return timeline.isFinished
  }
  
  var duration: Double {
    return timeline.duration
  }
  
  var size: CGSize {
    return assetWriterInput.naturalSize
  }
  
  init(withAssetWriterInput input: AVAssetWriterInput, andClock clock: CMClock) {
    self.assetWriterInput = input
    self.timeline = TrackTimeline(withClock: clock)
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
    if assetWriterInput.isReadyForMoreMediaData {
      let successful = assetWriterInput.append(buffer)
      if !successful {
        VisionLogger.log(level: .error, message: "Failed to write buffer \(timestamp.seconds) to track!")
      }
    } else {
      VisionLogger.log(level: .error, message: "Failed to write buffer \(timestamp.seconds) to track - " +
                       "the Asset Writer was not yet ready for more data!")
    }
    
    // 4. Check again; if the track is NOW finished, we want to finalize it.
    if timeline.isFinished {
      assetWriterInput.markAsFinished()
    }
  }
}
