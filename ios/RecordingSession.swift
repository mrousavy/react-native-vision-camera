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

// MARK: - RecordingSessionError

enum RecordingSessionError: Error {
  case failedToStartSession
}

// MARK: - RecordingSession

class RecordingSession {
  private let assetWriter: AVAssetWriter
  private var audioWriter: AVAssetWriterInput?
  private var bufferAdaptor: AVAssetWriterInputPixelBufferAdaptor?
  private let completionHandler: (AVAssetWriter.Status, Error?) -> Void

  private var initialTimestamp: CMTime?
  private var latestTimestamp: CMTime?
  private var hasWrittenFirstVideoFrame = false

  var url: URL {
    return assetWriter.outputURL
  }

  var duration: Double {
    guard let latestTimestamp = latestTimestamp,
          let initialTimestamp = initialTimestamp else {
      return 0.0
    }
    return (latestTimestamp - initialTimestamp).seconds
  }

  init(url: URL,
       fileType: AVFileType,
       completion: @escaping (AVAssetWriter.Status, Error?) -> Void) throws {
    completionHandler = completion

    do {
      assetWriter = try AVAssetWriter(outputURL: url, fileType: fileType)
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
  func initializeVideoWriter(withSettings settings: [String: Any], pixelFormat: OSType) {
    guard !settings.isEmpty else {
      ReactLogger.log(level: .error, message: "Tried to initialize Video Writer with empty settings!")
      return
    }
    guard bufferAdaptor == nil else {
      ReactLogger.log(level: .error, message: "Tried to add Video Writer twice!")
      return
    }

    let videoWriter = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
    videoWriter.expectsMediaDataInRealTime = true

    assetWriter.add(videoWriter)
    bufferAdaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: videoWriter,
                                                         withVideoSettings: settings,
                                                         pixelFormat: pixelFormat)
    ReactLogger.log(level: .info, message: "Initialized Video AssetWriter.")
  }

  /**
   Initializes an AssetWriter for audio frames (CMSampleBuffers).
   */
  func initializeAudioWriter(withSettings settings: [String: Any]) {
    guard !settings.isEmpty else {
      ReactLogger.log(level: .error, message: "Tried to initialize Audio Writer with empty settings!")
      return
    }
    guard audioWriter == nil else {
      ReactLogger.log(level: .error, message: "Tried to add Audio Writer twice!")
      return
    }

    audioWriter = AVAssetWriterInput(mediaType: .audio, outputSettings: settings)
    audioWriter!.expectsMediaDataInRealTime = true
    assetWriter.add(audioWriter!)
    ReactLogger.log(level: .info, message: "Initialized Audio AssetWriter.")
  }

  /**
   Start the Asset Writer(s). If the AssetWriter failed to start, an error will be thrown.
   */
  func start() throws {
    ReactLogger.log(level: .info, message: "Starting Asset Writer(s)...")

    let success = assetWriter.startWriting()
    if !success {
      ReactLogger.log(level: .error, message: "Failed to start Asset Writer(s)!")
      throw RecordingSessionError.failedToStartSession
    }

    initialTimestamp = CMTime(seconds: CACurrentMediaTime(), preferredTimescale: 1_000_000_000)
    assetWriter.startSession(atSourceTime: initialTimestamp!)
    ReactLogger.log(level: .info, message: "Started RecordingSession at \(initialTimestamp!.seconds) seconds.")
  }

  /**
   Appends a new CMSampleBuffer to the Asset Writer. Use bufferType to specify if this is a video or audio frame.
   The timestamp parameter represents the presentation timestamp of the buffer, which should be synchronized across video and audio frames.
   */
  func appendBuffer(_ buffer: CMSampleBuffer, type bufferType: BufferType, timestamp: CMTime) {
    guard assetWriter.status == .writing else {
      ReactLogger.log(level: .error, message: "Frame arrived, but AssetWriter status is \(assetWriter.status.descriptor)!")
      return
    }
    if !CMSampleBufferDataIsReady(buffer) {
      ReactLogger.log(level: .error, message: "Frame arrived, but sample buffer is not ready!")
      return
    }
    guard let initialTimestamp = initialTimestamp else {
      ReactLogger.log(level: .error,
                      message: "A frame arrived, but initialTimestamp was nil. Is this RecordingSession running?")
      return
    }

    latestTimestamp = timestamp

    switch bufferType {
    case .video:
      guard let bufferAdaptor = bufferAdaptor else {
        ReactLogger.log(level: .error, message: "Video Frame arrived but VideoWriter was nil!")
        return
      }
      if !bufferAdaptor.assetWriterInput.isReadyForMoreMediaData {
        ReactLogger.log(level: .warning,
                        message: "The Video AVAssetWriterInput was not ready for more data! Is your frame rate too high?")
        return
      }
      guard let imageBuffer = CMSampleBufferGetImageBuffer(buffer) else {
        ReactLogger.log(level: .error, message: "Failed to get the CVImageBuffer!")
        return
      }
      bufferAdaptor.append(imageBuffer, withPresentationTime: timestamp)
      if !hasWrittenFirstVideoFrame {
        hasWrittenFirstVideoFrame = true
        ReactLogger.log(level: .warning, message: "VideoWriter: First frame arrived \((initialTimestamp - timestamp).seconds) seconds late.")
      }
    case .audio:
      guard let audioWriter = audioWriter else {
        ReactLogger.log(level: .error, message: "Audio Frame arrived but AudioWriter was nil!")
        return
      }
      if !audioWriter.isReadyForMoreMediaData {
        return
      }
      if !hasWrittenFirstVideoFrame {
        // first video frame has not been written yet, so skip this audio frame.
        return
      }
      audioWriter.append(buffer)
    }

    if assetWriter.status == .failed {
      ReactLogger.log(level: .error,
                      message: "AssetWriter failed to write buffer! Error: \(assetWriter.error?.localizedDescription ?? "none")")
      finish()
    }
  }

  /**
   Marks the AssetWriters as finished and stops writing frames. The callback will be invoked either with an error or the status "success".
   */
  func finish() {
    ReactLogger.log(level: .info, message: "Finishing Recording with AssetWriter status \"\(assetWriter.status.descriptor)\"...")

    if !hasWrittenFirstVideoFrame {
      let error = NSError(domain: "capture/aborted",
                          code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "Stopped Recording Session too early, no frames have been recorded!"])
      completionHandler(.failed, error)
    } else if assetWriter.status == .writing {
      bufferAdaptor?.assetWriterInput.markAsFinished()
      audioWriter?.markAsFinished()
      assetWriter.finishWriting {
        self.completionHandler(self.assetWriter.status, self.assetWriter.error)
      }
    } else {
      completionHandler(assetWriter.status, assetWriter.error)
    }
  }
}
