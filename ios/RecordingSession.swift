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
  private let videoWriter: AVAssetWriterInput
  private let audioWriter: AVAssetWriterInput
  private let completionHandler: (AVAssetWriter.Status, Error?) -> Void
  private var didWriteFirstVideoFrame = false
  
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
      videoWriter = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
      audioWriter = AVAssetWriterInput(mediaType: .audio, outputSettings: audioSettings)
      completionHandler = completion
    } catch let error as NSError {
      throw CameraError.capture(.createRecorderError(message: error.description))
    }
    
    if !assetWriter.canAdd(videoWriter) {
      throw CameraError.capture(.createRecorderError(message: "The AVAssetWriter does not support the AVAssetWriterInput!"))
    }
    assetWriter.add(videoWriter)
    
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
      let startTime = CMSampleBufferGetPresentationTimeStamp(buffer)
      assetWriter.startWriting()
      assetWriter.startSession(atSourceTime: startTime)
    }
    
    switch bufferType {
    case .video:
      if !videoWriter.isReadyForMoreMediaData {
        return
      }
      videoWriter.append(buffer)
      didWriteFirstVideoFrame = true
    case .audio:
      if !didWriteFirstVideoFrame {
        return
      }
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
