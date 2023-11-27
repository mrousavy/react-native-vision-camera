//
//  RecordingSession.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 01.05.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation
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

  private var prepareTimestamp: CMTime?
  private var startTimestamp: CMTime?
  private var stopTimestamp: CMTime?

  private var lastWrittenTimestamp: CMTime?

  private let lock = DispatchSemaphore(value: 1)
  private var isFinishing = false
  private var hasWrittenLastVideoFrame = false
  private var hasWrittenLastAudioFrame = false

  // If we are waiting for late frames and none actually arrive, we force stop the session after the given timeout.
  private let automaticallyStopTimeoutSeconds = 4.0

  /**
   Gets the file URL of the recorded video.
   */
  var url: URL {
    return assetWriter.outputURL
  }

  /**
   Get the duration (in seconds) of the recorded video.
   */
  var duration: Double {
    guard let lastWrittenTimestamp = lastWrittenTimestamp,
          let startTimestamp = startTimestamp else {
      return 0.0
    }
    return (lastWrittenTimestamp - startTimestamp).seconds
  }

  init(url: URL,
       fileType: AVFileType,
       completion: @escaping (RecordingSession, AVAssetWriter.Status, Error?) -> Void) throws {
    completionHandler = completion

    do {
      assetWriter = try AVAssetWriter(outputURL: url, fileType: fileType)
      assetWriter.shouldOptimizeForNetworkUse = false
    } catch let error as NSError {
      throw CameraError.capture(.createRecorderError(message: error.description))
    }
  }

  deinit {
    if assetWriter.status == .writing {
      ReactLogger.log(level: .info, message: "Cancelling AssetWriter...")
      assetWriter.cancelWriting()
    }
  }

  /**
   Initializes an AssetWriter for video frames (CMSampleBuffers).
   */
  func initializeVideoWriter(withSettings settings: [String: Any]) {
    guard !settings.isEmpty else {
      ReactLogger.log(level: .error, message: "Tried to initialize Video Writer with empty settings!")
      return
    }
    guard videoWriter == nil else {
      ReactLogger.log(level: .error, message: "Tried to add Video Writer twice!")
      return
    }

    ReactLogger.log(level: .info, message: "Initializing Video AssetWriter with settings: \(settings.description)")
    videoWriter = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
    videoWriter!.expectsMediaDataInRealTime = true
    assetWriter.add(videoWriter!)
    ReactLogger.log(level: .info, message: "Initialized Video AssetWriter.")
  }

  /**
   Initializes an AssetWriter for audio frames (CMSampleBuffers).
   */
  func initializeAudioWriter(withSettings settings: [String: Any]?, format: CMFormatDescription) {
    guard audioWriter == nil else {
      ReactLogger.log(level: .error, message: "Tried to add Audio Writer twice!")
      return
    }

    if let settings = settings {
      ReactLogger.log(level: .info, message: "Initializing Audio AssetWriter with settings: \(settings.description)")
    } else {
      ReactLogger.log(level: .info, message: "Initializing Audio AssetWriter default settings...")
    }
    audioWriter = AVAssetWriterInput(mediaType: .audio, outputSettings: settings, sourceFormatHint: format)
    audioWriter!.expectsMediaDataInRealTime = true
    assetWriter.add(audioWriter!)
    ReactLogger.log(level: .info, message: "Initialized Audio AssetWriter.")
  }

  /**
   Prepare the RecordingSession using the current time of the provided synchronization clock.
   All buffers passed to [append] must be synchronized to this Clock.
   */
  func prepare(clock: CMClock) throws {
    let currentTime = CMClockGetTime(clock)
    ReactLogger.log(level: .info, message: "Preparing Asset Writer at \(currentTime.seconds)...")
    
    prepareTimestamp = currentTime
    let success = assetWriter.startWriting()
    guard success else {
      ReactLogger.log(level: .error, message: "Failed to prepare Asset Writer!")
      throw CameraError.capture(.createRecorderError(message: "Failed to prepare Asset Writer!"))
    }
    ReactLogger.log(level: .info, message: "Asset Writer prepared!")

    if audioWriter == nil {
      // Audio was enabled, mark the Audio track as finished so we won't wait for it.
      hasWrittenLastAudioFrame = true
    }
  }

  /**
   Requests the RecordingSession to stop writing frames at the current time of the provided synchronization clock.
   The RecordingSession will continue to write video frames and audio frames for a little longer if there was a delay
   in the video pipeline (e.g. caused by video stabilization) to avoid the video cutting off late frames.
   Once all late frames have been captured (or an artificial abort timeout has been triggered), the [completionHandler] will be called.
   */
  func stop(clock: CMClock) {
    // Current time of the synchronization clock (e.g. from [AVCaptureSession]) - this marks the end of the video.
    let currentTime = CMClockGetTime(clock)

    // Request a stop at the given time. Frames with later timestamps (e.g. early frames, while we are waiting for late frames) will be dropped.
    stopTimestamp = currentTime
    ReactLogger.log(level: .info,
                    message: "Requesting stop at \(currentTime.seconds) seconds for AssetWriter with status \"\(assetWriter.status.descriptor)\"...")

    // Start a timeout that will force-stop the session if none of the late frames actually arrive
    CameraQueues.cameraQueue.asyncAfter(deadline: .now() + automaticallyStopTimeoutSeconds) {
      if !self.isFinishing {
        ReactLogger.log(level: .error, message: "Waited \(self.automaticallyStopTimeoutSeconds) seconds but no late Frames came in, aborting capture...")
        self.finish()
      }
    }
  }

  /**
   Appends a new CMSampleBuffer to the Asset Writer.
   - Use clock to specify the CMClock instance this CMSampleBuffer uses for relative time
   - Use bufferType to specify if this is a video or audio frame.
   */
  func appendBuffer(_ buffer: CMSampleBuffer, clock _: CMClock, type bufferType: BufferType) {
    // 1. Check if the data is even ready
    guard let prepareTimestamp = prepareTimestamp else {
      // Session not yet prepared
      return
    }
    guard !isFinishing else {
      // Session is already finishing, can't write anything more
      return
    }
    guard assetWriter.status == .writing else {
      ReactLogger.log(level: .error, message: "Frame arrived, but AssetWriter status is \(assetWriter.status.descriptor)!")
      return
    }
    if !CMSampleBufferDataIsReady(buffer) {
      ReactLogger.log(level: .error, message: "Frame arrived, but sample buffer is not ready!")
      return
    }

    // 2. Check the timing of the buffer and make sure it's within our session start and stop times
    let timestamp = CMSampleBufferGetPresentationTimeStamp(buffer)
    if timestamp < prepareTimestamp {
      // Don't write this Frame, it was captured before we even started recording.
      // The reason this can happen is because the capture pipeline can have a delay, e.g. because of stabilization.
      let delay = prepareTimestamp - timestamp
      ReactLogger.log(level: .info, message: "Capture Pipeline has a delay of \(delay.seconds) seconds. Skipping this late Frame...")
      return
    }
    if let stopTimestamp = stopTimestamp,
       timestamp >= stopTimestamp {
      ReactLogger.log(level: .info, message: "Frame came in \((timestamp - stopTimestamp).seconds) seconds after we already called stop...")
      // This Frame is exactly at, or after the point in time when RecordingSession.stop() has been called.
      // Consider this the last Frame we write
      switch bufferType {
      case .video:
        if hasWrittenLastVideoFrame {
          // already wrote last Video Frame before, so skip this one.
          return
        }
        hasWrittenLastVideoFrame = true // flip to true, then write it
      case .audio:
        if hasWrittenLastAudioFrame {
          // already wrote last Audio Frame before, so skip this one.
          return
        }
        hasWrittenLastAudioFrame = true // flip to true, then write it
      }
    }
    
    if startTimestamp == nil {
      // Session has not yet been started
      ReactLogger.log(level: .info, message: "Buffer arrived at \(timestamp.seconds), but session has not yet been started.")
      
      if bufferType == .video {
        ReactLogger.log(level: .info, message: "It's a video frame, let's start the session!")
        startTimestamp = timestamp
        assetWriter.startSession(atSourceTime: timestamp)
      } else {
        return
      }
    }

    // 3. Actually write the Buffer to the AssetWriter
    let writer = getAssetWriter(forType: bufferType)
    guard writer.isReadyForMoreMediaData else {
      ReactLogger.log(level: .warning, message: "\(bufferType) AssetWriter is not ready for more data, dropping this Frame...")
      return
    }
    writer.append(buffer)
    lastWrittenTimestamp = timestamp

    // 4. If we failed to write the frames, stop the Recording
    if assetWriter.status == .failed {
      ReactLogger.log(level: .error,
                      message: "AssetWriter failed to write buffer! Error: \(assetWriter.error?.localizedDescription ?? "none")")
      finish()
    }

    // 5. If we finished writing both the last video and audio buffers, finish the recording
    if hasWrittenLastAudioFrame && hasWrittenLastVideoFrame {
      ReactLogger.log(level: .info, message: "Successfully appended last \(bufferType) Buffer (at \(timestamp.seconds) seconds), finishing RecordingSession...")
      finish()
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

    ReactLogger.log(level: .info, message: "Stopping AssetWriter with status \"\(assetWriter.status.descriptor)\"...")

    guard !isFinishing else {
      ReactLogger.log(level: .warning, message: "Tried calling finish() twice while AssetWriter is still writing!")
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
