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
  private var isFinishing = false

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
   Returns whether all tracks are marked as finished, or not.
   */
  var isFinished: Bool {
    let isVideoTrackFinished = videoTrack?.isFinished ?? true
    let isAudioTrackFinished = audioTrack?.isFinished ?? true
    return isVideoTrackFinished && isAudioTrackFinished
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
  func initializeVideoTrack(withSettings settings: [String: Any]) throws {
    guard !settings.isEmpty else {
      throw CameraError.capture(.createRecorderError(message: "Tried to initialize Video Track with empty options!"))
    }
    guard videoTrack == nil else {
      throw CameraError.capture(.createRecorderError(message: "Tried to initialize Video Track twice!"))
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
  func initializeAudioTrack(withSettings settings: [String: Any]?, format: CMFormatDescription) throws {
    guard audioTrack == nil else {
      throw CameraError.capture(.createRecorderError(message: "Tried to initialize Audio Track twice!"))
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
  
  func appendVideoBuffer(_ buffer: CMSampleBuffer) throws {
    guard let videoTrack else {
      throw CameraError.unknown(message: "Tried appending a video buffer, but the video track is not initialized!", cause: nil)
    }
    
    videoTrack.append(buffer: buffer)
  }
  
  func append(buffer: CMSampleBuffer, ofType bufferType: BufferType) throws {
    guard !isFinishing else {
      // Session is already finishing, can't write anything more
      return
    }
    guard assetWriter.status == .writing else {
      throw CameraError.capture(.unknown(message: "Frame arrived, but AssetWriter status is \(assetWriter.status.descriptor)!"))
    }
    
    // Write buffer to video/audio track
    let track = try getTrack(ofType: bufferType)
    track.append(buffer: buffer)
    
    // If we failed to write the frames, stop the Recording
    if assetWriter.status == .failed {
      let error = assetWriter.error?.localizedDescription ?? "(unknown error)"
      VisionLogger.log(level: .error, message: "AssetWriter failed to write buffer! Error: \(error)")
      finish()
      return
    }
    
    // When all tracks (video + audio) are finished, finish the Recording.
    if isFinished {
      finish()
    }
  }
  
  private func getTrack(ofType type: BufferType) throws -> Track {
    switch type {
    case .audio:
      guard let audioTrack else {
        throw CameraError.capture(.unknown(message: "Tried to write an audio buffer, but no audio track was initialized!"))
      }
      return audioTrack
    case .video:
      guard let videoTrack else {
        throw CameraError.capture(.unknown(message: "Tried to write a video buffer, but no video track was initialized!"))
      }
      return videoTrack
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
      // We're already finishing - there was a second call to this method.
      VisionLogger.log(level: .warning, message: "Tried calling finish() twice!")
      return
    }
    guard assetWriter.status == .writing else {
      // The asset writer has an error - cancel everything.
      VisionLogger.log(level: .error, message: "Failed to finish() - AssetWriter status was \(assetWriter.status.descriptor)!")
      completionHandler(self, assetWriter.status, assetWriter.error)
      assetWriter.cancelWriting()
      return
    }

    isFinishing = true
    assetWriter.finishWriting {
      self.completionHandler(self, self.assetWriter.status, self.assetWriter.error)
    }
  }
}
