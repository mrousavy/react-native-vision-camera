//
//  RecordingSession.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 01.05.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation
import AVFoundation

class RecordingSession {
  private var assetWriter: AVAssetWriter
  private var assetWriterInput: AVAssetWriterInput
  private var completionHandler: (AVAssetWriter.Status, Error?) -> Void
  
  var url: URL {
    return assetWriter.outputURL
  }
  
  var duration: Double {
    return assetWriter.overallDurationHint.seconds
  }
  
  init(url: URL,
       fileType: AVFileType,
       outputSettings: [String: Any],
       completion: @escaping (AVAssetWriter.Status, Error?) -> Void) throws {
    do {
      assetWriter = try AVAssetWriter(outputURL: url, fileType: fileType)
      assetWriterInput = AVAssetWriterInput(mediaType: .video, outputSettings: outputSettings)
      completionHandler = completion
    } catch let error as NSError {
      throw CameraError.capture(.createRecorderError(message: error.description))
    }
    
    if !assetWriter.canAdd(assetWriterInput) {
      throw CameraError.capture(.createRecorderError(message: "The AVAssetWriter does not support the AVAssetWriterInput!"))
    }
    assetWriter.add(assetWriterInput)
    
    // assetWriter!.producesCombinableFragments = false // <-- TODO: What value do I want here?
    let successful = assetWriter.startWriting()
    if !successful {
      throw CameraError.capture(.unknown(message: "Failed to start writing to the temporary file (\(url.absoluteString))"))
    }
    assetWriter.startSession(atSourceTime: CMTime.zero)
  }
  
  deinit {
    assetWriter.cancelWriting()
  }
  
  func appendBuffer(_ buffer: CMSampleBuffer) {
    if !assetWriterInput.isReadyForMoreMediaData {
      return
    }
    assetWriterInput.append(buffer)
  }
  
  func finish() {
    assetWriterInput.markAsFinished()
    assetWriter.finishWriting {
      self.completionHandler(self.assetWriter.status, self.assetWriter.error)
    }
  }
}
