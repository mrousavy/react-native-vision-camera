//
//  RecordingSession.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 01.05.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import AVFoundation
import Foundation

// MARK: - BufferType

enum BufferType {
  case audio
  case video
}

// MARK: - RecordingSession

class RecordingSession {
  private let assetWriter: AVAssetWriter
  private let audioWriter: AVAssetWriterInput
  private let videoWriter: AVAssetWriterInput
  private let bufferAdaptor: AVAssetWriterInputPixelBufferAdaptor
  private let completionHandler: (AVAssetWriter.Status, Error?) -> Void

  private let initialTimestamp: CMTime
  private var latestTimestamp: CMTime?
  private var hasWrittenFirstVideoFrame = false

  var url: URL {
    return assetWriter.outputURL
  }

  var duration: Double {
    guard let latestTimestamp = latestTimestamp else {
      return 0.0
    }
    return (latestTimestamp - initialTimestamp).seconds
  }

  init(url: URL,
       fileType: AVFileType,
       videoSettings: [String: Any],
       audioSettings: [String: Any],
       isVideoMirrored: Bool,
       completion: @escaping (AVAssetWriter.Status, Error?) -> Void) throws {
    do {
      assetWriter = try AVAssetWriter(outputURL: url, fileType: fileType)
      audioWriter = AVAssetWriterInput(mediaType: .audio, outputSettings: audioSettings)
      videoWriter = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
      completionHandler = completion
    } catch let error as NSError {
      throw CameraError.capture(.createRecorderError(message: error.description))
    }

    audioWriter.expectsMediaDataInRealTime = true
    videoWriter.expectsMediaDataInRealTime = true
    if isVideoMirrored {
      videoWriter.transform = CGAffineTransform(rotationAngle: -(.pi / 2))
    } else {
      videoWriter.transform = CGAffineTransform(rotationAngle: .pi / 2)
    }

    bufferAdaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: videoWriter, withVideoSettings: videoSettings)

    assetWriter.add(videoWriter)
    assetWriter.add(audioWriter)

    assetWriter.startWriting()
    initialTimestamp = CMTime(seconds: CACurrentMediaTime(), preferredTimescale: 1_000_000_000)
    assetWriter.startSession(atSourceTime: initialTimestamp)
    ReactLogger.log(level: .info, message: "Initialized Video and Audio AssetWriter.")
  }

  deinit {
    if assetWriter.status == .writing {
      ReactLogger.log(level: .info, message: "Cancelling AssetWriter...")
      assetWriter.cancelWriting()
    }
  }

  func appendBuffer(_ buffer: CMSampleBuffer, type bufferType: BufferType) {
    if !CMSampleBufferDataIsReady(buffer) {
      return
    }

    let timestamp = CMSampleBufferGetPresentationTimeStamp(buffer)
    latestTimestamp = timestamp

    switch bufferType {
    case .video:
      if !videoWriter.isReadyForMoreMediaData {
        ReactLogger.log(level: .warning, message: "The Video AVAssetWriterInput was not ready for more data! Is your frame rate too high?")
        return
      }
      guard let imageBuffer = CMSampleBufferGetImageBuffer(buffer) else {
        ReactLogger.log(level: .error, message: "Failed to get the CVImageBuffer!")
        return
      }
      bufferAdaptor.append(imageBuffer, withPresentationTime: timestamp)
      if !hasWrittenFirstVideoFrame {
        hasWrittenFirstVideoFrame = true
        ReactLogger.log(level: .warning, message: "VideoWriter: First frame arrived \((timestamp - initialTimestamp).seconds) seconds late.")
      }
    case .audio:
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
      ReactLogger.log(level: .error, message: "AssetWriter failed to write buffer! Error: \(assetWriter.error?.localizedDescription ?? "none")")
    }
  }

  func finish() {
    ReactLogger.log(level: .info, message: "Finishing Recording with AssetWriter status \"\(assetWriter.status.descriptor)\"...")
    if assetWriter.status == .writing {
      videoWriter.markAsFinished()
      assetWriter.finishWriting {
        self.completionHandler(self.assetWriter.status, self.assetWriter.error)
      }
    } else {
      completionHandler(assetWriter.status, assetWriter.error)
    }
  }
}
