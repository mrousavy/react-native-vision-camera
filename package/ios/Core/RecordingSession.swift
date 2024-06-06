//
//  RecordingSession.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 01.05.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation
import CoreLocation
import Foundation

// MARK: - BufferType

enum BufferType {
  case audio
  case video
}

// MARK: - RecordingSession

/**
 A [RecordingSession] class that can record video and audio [CMSampleBuffers] from [AVCaptureVideoDataOutput] and
 [AVCaptureAudioDataOutput] into a .mov/.mp4 file using [AVAssetWriter].

 It also synchronizes buffers to the CMTime by the CaptureSession so that late frames are removed from the beginning and added
 towards the end (useful e.g. for videoStabilization).
 */
class RecordingSession {
  private let assetWriter: AVAssetWriter
  private var audioWriter: AVAssetWriterInput?
  private var videoWriter: AVAssetWriterInput?
  private let completionHandler: (RecordingSession, AVAssetWriter.Status, Error?) -> Void
  private let clockSession: ClockSession
  
  private var isFinishing = false
  private var hasWrittenLastVideoFrame = false
  private var hasWrittenLastAudioFrame = false

  private let lock = DispatchSemaphore(value: 1)

  // If we are waiting for late frames and none actually arrive, we force stop the session after the given timeout.
  private let automaticallyStopTimeoutSeconds = 4.0
  

  /**
   Gets the file URL of the recorded video.
   */
  var url: URL {
    return assetWriter.outputURL
  }

  /**
   Gets the size of the recorded video, in pixels.
   */
  var size: CGSize? {
    return videoWriter?.naturalSize
  }

  /**
   Get the duration (in seconds) of the recorded video.
   */
  var duration: Double {
    return clockSession.duration
  }

  /**
   Get the presentation orientation of the video.
   */
  let videoOrientation: Orientation

  init(url: URL,
       fileType: AVFileType,
       metadataProvider: MetadataProvider,
       clock: CMClock,
       orientation: Orientation,
       completion: @escaping (RecordingSession, AVAssetWriter.Status, Error?) -> Void) throws {
    completionHandler = completion
    videoOrientation = orientation
    clockSession = ClockSession(clock: clock)
    VisionLogger.log(level: .info, message: "Creating RecordingSession... (orientation: \(orientation))")

    do {
      assetWriter = try AVAssetWriter(outputURL: url, fileType: fileType)
      assetWriter.shouldOptimizeForNetworkUse = false
    } catch let error as NSError {
      throw CameraError.capture(.createRecorderError(message: error.description))
    }

    // Assign the metadata item to the asset writer
    let metadataItems = metadataProvider.createVideoMetadata()
    assetWriter.metadata.append(contentsOf: metadataItems)
  }

  deinit {
    if assetWriter.status == .writing {
      VisionLogger.log(level: .info, message: "Cancelling AssetWriter...")
      assetWriter.cancelWriting()
    }
  }

  /**
   Initializes an AssetWriter for video frames (CMSampleBuffers).
   */
  func initializeVideoWriter(withSettings settings: [String: Any]) {
    guard !settings.isEmpty else {
      VisionLogger.log(level: .error, message: "Tried to initialize Video Writer with empty settings!")
      return
    }
    guard videoWriter == nil else {
      VisionLogger.log(level: .error, message: "Tried to add Video Writer twice!")
      return
    }

    VisionLogger.log(level: .info, message: "Initializing Video AssetWriter with settings: \(settings.description)")
    videoWriter = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
    videoWriter!.expectsMediaDataInRealTime = true
    videoWriter!.transform = videoOrientation.affineTransform
    assetWriter.add(videoWriter!)
    VisionLogger.log(level: .info, message: "Initialized Video AssetWriter.")
  }

  /**
   Initializes an AssetWriter for audio frames (CMSampleBuffers).
   */
  func initializeAudioWriter(withSettings settings: [String: Any]?, format: CMFormatDescription) {
    guard audioWriter == nil else {
      VisionLogger.log(level: .error, message: "Tried to add Audio Writer twice!")
      return
    }

    if let settings = settings {
      VisionLogger.log(level: .info, message: "Initializing Audio AssetWriter with settings: \(settings.description)")
    } else {
      VisionLogger.log(level: .info, message: "Initializing Audio AssetWriter default settings...")
    }
    audioWriter = AVAssetWriterInput(mediaType: .audio, outputSettings: settings, sourceFormatHint: format)
    audioWriter!.expectsMediaDataInRealTime = true
    assetWriter.add(audioWriter!)
    VisionLogger.log(level: .info, message: "Initialized Audio AssetWriter.")
  }

  /**
   Start the RecordingSession using the current time of the provided synchronization clock.
   All buffers passed to [append] must be synchronized to this Clock.
   */
  func start(clock: CMClock) throws {
    lock.wait()
    defer {
      lock.signal()
    }

    VisionLogger.log(level: .info, message: "Starting Asset Writer(s)...")

    let success = assetWriter.startWriting()
    guard success else {
      VisionLogger.log(level: .error, message: "Failed to start Asset Writer(s)!")
      throw CameraError.capture(.createRecorderError(message: "Failed to start Asset Writer(s)!"))
    }

    VisionLogger.log(level: .info, message: "Asset Writer(s) started!")

    // Start the clock
    clockSession.start()

    if audioWriter == nil {
      // Audio was disabled, mark the Audio track as finished so we won't wait for it.
      hasWrittenLastAudioFrame = true
    }
  }

  /**
   Requests the RecordingSession to stop writing frames at the current time of the provided synchronization clock.
   The RecordingSession will continue to write video frames and audio frames that have been produced (but not yet consumed)
   before the requested timestamp.
   This may happen if the Camera pipeline has an additional processing overhead, e.g. when video stabilization is enabled.
   Once all late frames have been captured (or an artificial abort timeout has been triggered), the [completionHandler] will be called.
   */
  func stop(clock: CMClock) {
    lock.wait()
    defer {
      lock.signal()
    }
    
    VisionLogger.log(level: .info, message: "Stopping Asset Writer(s) with status \"\(assetWriter.status.descriptor)\"...")
    
    // Stop the clock
    clockSession.stop()

    // Start a timeout that will force-stop the session if none of the late frames actually arrive
    CameraQueues.cameraQueue.asyncAfter(deadline: .now() + automaticallyStopTimeoutSeconds) {
      if !self.isFinishing {
        VisionLogger.log(level: .error, message: "Waited \(self.automaticallyStopTimeoutSeconds) seconds but no late Frames came in, aborting capture...")
        self.finish()
      }
    }
  }
  
  /**
   Requests the RecordingSession to temporarily pause writing frames at the current time of the provided synchronization clock.
   The RecordingSession will continue to write video frames and audio frames that have been produced (but not yet consumed)
   before the requested timestamp.
   This may happen if the Camera pipeline has an additional processing overhead, e.g. when video stabilization is enabled.
   */
  func pause(clock: CMClock) {
    lock.wait()
    defer {
      lock.signal()
    }

    // Pause the clock
    clockSession.pause()
  }
  
  /**
   Resumes the RecordingSession and starts writing frames starting with the time of the provided synchronization clock.
   */
  func resume(clock: CMClock) {
    lock.wait()
    defer {
      lock.signal()
    }

    // Resume the clock
    clockSession.resume()
  }

  /**
   Appends a new CMSampleBuffer to the Asset Writer.
   - Use clock to specify the CMClock instance this CMSampleBuffer uses for relative time
   - Use bufferType to specify if this is a video or audio frame.
   */
  func appendBuffer(_ buffer: CMSampleBuffer, clock _: CMClock, type bufferType: BufferType) {
    // 1. Prepare the data
    guard !isFinishing else {
      // Session is already finishing, can't write anything more
      return
    }
    guard assetWriter.status == .writing else {
      VisionLogger.log(level: .error, message: "Frame arrived, but AssetWriter status is \(assetWriter.status.descriptor)!")
      return
    }
    guard CMSampleBufferDataIsReady(buffer) else {
      VisionLogger.log(level: .error, message: "Frame arrived, but sample buffer is not ready!")
      return
    }
    
    // 2. Check the timing of the buffer and make sure it's not after we requested a session stop
    let timestamp = CMSampleBufferGetPresentationTimeStamp(buffer)
    guard clockSession.isTimestampWithinTimeline(timestamp: timestamp) else {
      VisionLogger.log(level: .debug, message: "Frame arrived, but it's timestamp is outside of what we want to record.")
      return
    }

    // 2. Check the timing of the buffer and make sure it's not after we requested a session stop
    if let stopTimestamp = stopTimestamp,
       timestamp >= stopTimestamp {
      // This Frame is exactly at, or after the point in time when RecordingSession.stop() has been called.
      // Consider this the last Frame we write
      switch bufferType {
      case .video:
        if hasWrittenLastVideoFrame {
          // already wrote last Video Frame before, so skip this one.
          return
        }
        hasWrittenLastVideoFrame = true // flip to true, then fallthrough & write it
      case .audio:
        if hasWrittenLastAudioFrame {
          // already wrote last Audio Frame before, so skip this one.
          return
        }
        hasWrittenLastAudioFrame = true // flip to true, then fallthrough & write it
      }
    }

    // 3. Actually write the Buffer to the AssetWriter
    let writer = getAssetWriter(forType: bufferType)
    guard writer.isReadyForMoreMediaData else {
      VisionLogger.log(level: .warning, message: "\(bufferType) AssetWriter is not ready for more data, dropping this Frame...")
      return
    }
    writer.append(buffer)

    // 4. If we failed to write the frames, stop the Recording
    if assetWriter.status == .failed {
      VisionLogger.log(level: .error,
                       message: "AssetWriter failed to write buffer! Error: \(assetWriter.error?.localizedDescription ?? "none")")
      finish()
      return
    }

    // 5. If we finished writing both the last video and audio buffers, finish the recording
    if hasWrittenLastAudioFrame && hasWrittenLastVideoFrame {
      VisionLogger.log(level: .info, message: "Successfully appended last \(bufferType) Buffer (at \(timestamp.seconds) seconds), " +
        "finishing RecordingSession...")
      finish()
      return
    }
  }

  private func getAssetWriter(forType type: BufferType) -> AVAssetWriterInput {
    switch type {
    case .video:
      guard let videoWriter = videoWriter else {
        fatalError("Tried to append to a Video Buffer, which was nil!")
      }
      return videoWriter
    case .audio:
      guard let audioWriter = audioWriter else {
        fatalError("Tried to append to a Audio Buffer, which was nil!")
      }
      return audioWriter
    }
  }

  /**
   Stops the AssetWriters and calls the completion callback.
   */
  private func finish() {
    lock.wait()
    defer {
      lock.signal()
    }

    VisionLogger.log(level: .info, message: "Stopping AssetWriter with status \"\(assetWriter.status.descriptor)\"...")

    guard !isFinishing else {
      VisionLogger.log(level: .warning, message: "Tried calling finish() twice while AssetWriter is still writing!")
      return
    }
    guard assetWriter.status == .writing else {
      completionHandler(self, assetWriter.status, assetWriter.error)
      return
    }

    isFinishing = true
    videoWriter?.markAsFinished()
    audioWriter?.markAsFinished()
    assetWriter.finishWriting {
      self.completionHandler(self, self.assetWriter.status, self.assetWriter.error)
    }
  }
}
