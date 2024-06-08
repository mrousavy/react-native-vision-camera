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
  private let clock: CMClock
  private let assetWriter: AVAssetWriter
  private var videoTrack: Track?
  private var audioTrack: Track?
  private let completionHandler: (RecordingSession, AVAssetWriter.Status, Error?) -> Void

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
  var size: CGSize {
    return videoTrack?.size ?? CGSize.zero
  }

  /**
   Get the duration (in seconds) of the recorded video.
   */
  var duration: Double {
    return videoTrack?.duration ?? 0.0
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
    self.completionHandler = completion
    self.clock = clock
    self.videoOrientation = orientation
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
   Initializes the video track.
   */
  func initializeVideoTrack(withSettings settings: [String: Any]) {
    guard !settings.isEmpty else {
      VisionLogger.log(level: .error, message: "Tried to initialize Video Writer with empty settings!")
      return
    }
    guard videoTrack == nil else {
      VisionLogger.log(level: .error, message: "Tried to add Video Writer twice!")
      return
    }

    VisionLogger.log(level: .info, message: "Initializing Video AssetWriter with settings: \(settings.description)")
    let videoWriter = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
    videoWriter.expectsMediaDataInRealTime = true
    videoWriter.transform = videoOrientation.affineTransform
    assetWriter.add(videoWriter)
    videoTrack = Track(withAssetWriterInput: videoWriter, andClock: clock)
    VisionLogger.log(level: .info, message: "Initialized Video AssetWriter.")
  }

  /**
   Initializes the audio track.
   */
  func initializeAudioTrack(withSettings settings: [String: Any]?, format: CMFormatDescription) {
    guard audioTrack == nil else {
      VisionLogger.log(level: .error, message: "Tried to add Audio Writer twice!")
      return
    }

    if let settings = settings {
      VisionLogger.log(level: .info, message: "Initializing Audio AssetWriter with settings: \(settings.description)")
    } else {
      VisionLogger.log(level: .info, message: "Initializing Audio AssetWriter default settings...")
    }
    let audioWriter = AVAssetWriterInput(mediaType: .audio, outputSettings: settings, sourceFormatHint: format)
    audioWriter.expectsMediaDataInRealTime = true
    assetWriter.add(audioWriter)
    audioTrack = Track(withAssetWriterInput: audioWriter, andClock: clock)
    VisionLogger.log(level: .info, message: "Initialized Audio AssetWriter.")
  }

  /**
   Start the RecordingSession using the current time of the provided synchronization clock.
   All buffers passed to [append] must be synchronized to this Clock.
   */
  func start() throws {
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

    // Start both tracks
    videoTrack?.start()
    audioTrack?.start()
  }

  /**
   Requests the RecordingSession to stop writing frames at the current time of the provided synchronization clock.
   The RecordingSession will continue to write video frames and audio frames that have been produced (but not yet consumed)
   before the requested timestamp.
   This may happen if the Camera pipeline has an additional processing overhead, e.g. when video stabilization is enabled.
   Once all late frames have been captured (or an artificial abort timeout has been triggered), the [completionHandler] will be called.
   */
  func stop() {
    lock.wait()
    defer {
      lock.signal()
    }
    
    VisionLogger.log(level: .info, message: "Stopping Asset Writer(s) with status \"\(assetWriter.status.descriptor)\"...")
    
    // Stop both tracks
    videoTrack?.stop()
    audioTrack?.stop()

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
  func pause() {
    lock.wait()
    defer {
      lock.signal()
    }
    
    // Stop both tracks
    videoTrack?.pause()
    audioTrack?.pause()
  }
  
  /**
   Resumes the RecordingSession and starts writing frames starting with the time of the provided synchronization clock.
   */
  func resume() {
    lock.wait()
    defer {
      lock.signal()
    }
    
    // Resume both tracks
    videoTrack?.resume()
    audioTrack?.resume()
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
    
    // 2. Check the timing of the buffer and make sure it's not after we requested a session stop or pause
    let timestamp = CMSampleBufferGetPresentationTimeStamp(buffer)
    let shouldWrite = clockSession.isTimestampWithinTimeline(timestamp: timestamp)
    
    // 3. If yes, write the Buffer to the AssetWriter
    if shouldWrite {
      let writer = getAssetWriter(forType: bufferType)
      guard writer.isReadyForMoreMediaData else {
        VisionLogger.log(level: .warning, message: "\(bufferType) AssetWriter is not ready for more data, dropping this Frame...")
        return
      }
      writer.append(buffer)
    }
    
    // 4. If we failed to write the frames, stop the Recording
    if assetWriter.status == .failed {
      let error = assetWriter.error?.localizedDescription ?? "(unknown error)"
      VisionLogger.log(level: .error, message: "AssetWriter failed to write buffer! Error: \(error)")
      finish()
      return
    }
    
    // 5. If we finished writing both the last video and audio buffers, finish the recording
    if clockSession.isFinished {
      VisionLogger.log(level: .info, message: "Successfully appended last \(bufferType) Buffer (at \(timestamp.seconds) seconds), " +
        "finishing RecordingSession...")
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
