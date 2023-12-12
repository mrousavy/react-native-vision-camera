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

  private var startTimestamp: CMTime?
  private var stopTimestamp: CMTime?

  private var lastWrittenTimestamp: CMTime?

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
   Start the RecordingSession using the current time of the provided synchronization clock.
   All buffers passed to [append] must be synchronized to this Clock.
   */
  func start(clock: CMClock) throws {
    lock.wait()
    defer {
      lock.signal()
    }

    ReactLogger.log(level: .info, message: "Starting Asset Writer(s)...")

    let success = assetWriter.startWriting()
    guard success else {
      ReactLogger.log(level: .error, message: "Failed to start Asset Writer(s)!")
      throw CameraError.capture(.createRecorderError(message: "Failed to start Asset Writer(s)!"))
    }

    ReactLogger.log(level: .info, message: "Asset Writer(s) started!")

    // Get the current time of the AVCaptureSession.
    // Note: The current time might be more advanced than this buffer's timestamp, for example if the video
    // pipeline had some additional delay in processing the buffer (aka it is late) - eg because of Video Stabilization (~1s delay).
    let currentTime = CMClockGetTime(clock)

    // Start the sesssion at the given time. Frames with earlier timestamps (e.g. late frames) will be dropped.
    assetWriter.startSession(atSourceTime: currentTime)
    startTimestamp = currentTime
    ReactLogger.log(level: .info, message: "Started RecordingSession at time: \(currentTime.seconds)")

    if audioWriter == nil {
      // Audio was disabled, mark the Audio track as finished so we won't wait for it.
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
    lock.wait()
    defer {
      lock.signal()
    }

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
    // 1. Prepare the data
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

    // 2. Check the timing of the buffer and make sure it's not after we requested a session stop
    let timestamp = CMSampleBufferGetPresentationTimeStamp(buffer)
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
