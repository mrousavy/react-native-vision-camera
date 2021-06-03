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

enum BufferType: String {
  case audio
  case video
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
      ReactLogger.log(level: .info, message: "Cancelling AssetWriter...", alsoLogToJS: true)
      assetWriter.cancelWriting()
    }
  }

  func initializeVideoWriter(withSettings settings: [String: Any], isVideoMirrored: Bool) {
    guard !settings.isEmpty else {
      ReactLogger.log(level: .error, message: "Tried to initialize Video Writer with empty settings!", alsoLogToJS: true)
      return
    }
    guard bufferAdaptor == nil else {
      ReactLogger.log(level: .error, message: "Tried to add Video Writer twice!", alsoLogToJS: true)
      return
    }

    let videoWriter = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
    videoWriter.expectsMediaDataInRealTime = true

    if isVideoMirrored {
      videoWriter.transform = CGAffineTransform(rotationAngle: -(.pi / 2))
    } else {
      videoWriter.transform = CGAffineTransform(rotationAngle: .pi / 2)
    }

    assetWriter.add(videoWriter)
    bufferAdaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: videoWriter, withVideoSettings: settings)
    ReactLogger.log(level: .info, message: "Initialized Video AssetWriter.")
  }

  func initializeAudioWriter(withSettings settings: [String: Any]) {
    guard !settings.isEmpty else {
      ReactLogger.log(level: .error, message: "Tried to initialize Audio Writer with empty settings!", alsoLogToJS: true)
      return
    }
    guard audioWriter == nil else {
      ReactLogger.log(level: .error, message: "Tried to add Audio Writer twice!", alsoLogToJS: true)
      return
    }

    audioWriter = AVAssetWriterInput(mediaType: .audio, outputSettings: settings)
    audioWriter!.expectsMediaDataInRealTime = true
    assetWriter.add(audioWriter!)
    ReactLogger.log(level: .info, message: "Initialized Audio AssetWriter.")
  }

  func start() {
    assetWriter.startWriting()
    initialTimestamp = CMTime(seconds: CACurrentMediaTime(), preferredTimescale: 1_000_000_000)
    assetWriter.startSession(atSourceTime: initialTimestamp!)
    ReactLogger.log(level: .info, message: "Started RecordingSession at \(initialTimestamp!.seconds) seconds.")
  }

  func appendBuffer(_ buffer: CMSampleBuffer, type bufferType: BufferType, timestamp: CMTime) {
    if !CMSampleBufferDataIsReady(buffer) {
      return
    }
    guard let initialTimestamp = initialTimestamp else {
      ReactLogger.log(level: .error,
                      message: "A \(bufferType.rawValue) frame arrived, but initialTimestamp was nil. Is this RecordingSession running?",
                      alsoLogToJS: true)
      return
    }

    latestTimestamp = timestamp

    switch bufferType {
    case .video:
      guard let bufferAdaptor = bufferAdaptor else {
        ReactLogger.log(level: .error, message: "Video Frame arrived but VideoWriter was nil!", alsoLogToJS: true)
        return
      }
      if !bufferAdaptor.assetWriterInput.isReadyForMoreMediaData {
        ReactLogger.log(level: .warning,
                        message: "The Video AVAssetWriterInput was not ready for more data! Is your frame rate too high?",
                        alsoLogToJS: true)
        return
      }
      guard let imageBuffer = CMSampleBufferGetImageBuffer(buffer) else {
        ReactLogger.log(level: .error, message: "Failed to get the CVImageBuffer!", alsoLogToJS: true)
        return
      }
      bufferAdaptor.append(imageBuffer, withPresentationTime: timestamp)
      if !hasWrittenFirstVideoFrame {
        hasWrittenFirstVideoFrame = true
        ReactLogger.log(level: .warning, message: "VideoWriter: First frame arrived \((timestamp - initialTimestamp).seconds) seconds late.")
      }
    case .audio:
      guard let audioWriter = audioWriter else {
        ReactLogger.log(level: .error, message: "Audio Frame arrived but AudioWriter was nil!", alsoLogToJS: true)
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
      // TODO: Should I call the completion handler or is this instance still valid?
      ReactLogger.log(level: .error,
                      message: "AssetWriter failed to write buffer! Error: \(assetWriter.error?.localizedDescription ?? "none")",
                      alsoLogToJS: true)
    }
  }

  func finish() {
    ReactLogger.log(level: .info, message: "Finishing Recording with AssetWriter status \"\(assetWriter.status.descriptor)\"...")
    if assetWriter.status == .writing {
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
