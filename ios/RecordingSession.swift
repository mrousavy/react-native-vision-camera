//
//  RecordingSession.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 01.05.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation
import AVFoundation

enum BufferType {
  case audio
  case video
}

class RecordingSession {
  private let assetWriter: AVAssetWriter
  private let audioWriter: AVAssetWriterInput
  private let videoWriter: AVAssetWriterInput
  private let bufferAdapter: AVAssetWriterInputPixelBufferAdaptor
  private let completionHandler: (AVAssetWriter.Status, Error?) -> Void
  
  private var startTimestamp: CMTime? = nil
  
  var url: URL {
    return assetWriter.outputURL
  }
  
  var duration: Double {
    return assetWriter.overallDurationHint.seconds
  }
  
  init(url: URL,
       fileType: AVFileType,
       videoSettings: [String: Any],
       audioSettings: [String: Any],
       completion: @escaping (AVAssetWriter.Status, Error?) -> Void) throws {
    do {
      assetWriter = try AVAssetWriter(outputURL: url, fileType: fileType)
      audioWriter = AVAssetWriterInput(mediaType: .audio, outputSettings: audioSettings)
      videoWriter = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
      bufferAdapter = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: videoWriter, sourcePixelBufferAttributes: nil)
      completionHandler = completion
    } catch let error as NSError {
      throw CameraError.capture(.createRecorderError(message: error.description))
    }
    
    videoWriter.expectsMediaDataInRealTime = true
    audioWriter.expectsMediaDataInRealTime = true
    
    assetWriter.add(videoWriter)
    assetWriter.add(audioWriter)
    
    // assetWriter!.producesCombinableFragments = false // <-- TODO: What value do I want here?
  }
  
  deinit {
    assetWriter.cancelWriting()
  }
  
  func appendBuffer(_ buffer: CMSampleBuffer, type bufferType: BufferType) {
    if !CMSampleBufferDataIsReady(buffer) {
      return
    }
    
    if assetWriter.status == .unknown {
      if bufferType == .video {
        let startTime = CMSampleBufferGetPresentationTimeStamp(buffer)
        assetWriter.startWriting()
        assetWriter.startSession(atSourceTime: startTime)
      } else {
        // if we didn't receive a Video buffer we don't want to start recording yet.
        // the first buffer strictly has to be a video frame.
        return
      }
    }
    
    switch bufferType {
    case .video:
      if !videoWriter.isReadyForMoreMediaData {
        ReactLogger.log(level: .warning, message: "The Video AVAssetWriterInput was not ready for more data! Is your frame rate too high?")
        return
      }
      let timestamp = CMSampleBufferGetPresentationTimeStamp(buffer)
      if startTimestamp == nil {
        startTimestamp = timestamp
      }
      let time = CMTime(seconds: timestamp.seconds - startTimestamp!.seconds, preferredTimescale: CMTimeScale(bitPattern: 600))
      bufferAdapter.append(CMSampleBufferGetImageBuffer(buffer)!, withPresentationTime: time)
    case .audio:
      if !audioWriter.isReadyForMoreMediaData {
        return
      }
      audioWriter.append(buffer)
    }
  }
  
  func finish() {
    videoWriter.markAsFinished()
    assetWriter.finishWriting {
      self.completionHandler(self.assetWriter.status, self.assetWriter.error)
    }
  }
}
