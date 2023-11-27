//
//  QueueableAssetWriter.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 27.11.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import Foundation
import AVFoundation

class QueueableAssetWriter {
  private let assetWriter: AVAssetWriter
  private var initTime: CMTime? = nil
  private var startTime: CMTime? = nil
  private var stopTime: CMTime? = nil
  private let lock = DispatchSemaphore(value: 1)
  
  var audio: Input? = nil
  var video: Input? = nil
  
  var outputURL: URL {
    return assetWriter.outputURL
  }
  var status: AVAssetWriter.Status {
    return assetWriter.status
  }
  
  var isStarted: Bool {
    return startTime != nil
  }
  var isRecording: Bool {
    return startTime != nil && stopTime == nil
  }
  var isFinished: Bool {
    return startTime != nil && stopTime != nil
  }
  
  init(url: URL, fileType: AVFileType) throws {
    assetWriter = try AVAssetWriter(outputURL: url, fileType: fileType)
    assetWriter.shouldOptimizeForNetworkUse = false
  }
  
  deinit {
    if assetWriter.status == .writing {
      ReactLogger.log(level: .info, message: "Cancelling AssetWriter...")
      assetWriter.cancelWriting()
    }
  }
  
  func prepare(at time: CMTime) throws {
    ReactLogger.log(level: .info, message: "Preparing AVAssetWriter at \(time.seconds)...")
    initTime = time
    let success = assetWriter.startWriting()
    if !success {
      let error = assetWriter.error?.localizedDescription ?? "(no error)"
      throw CameraError.capture(.createRecorderError(message: "Failed to start the AVAssetWriter! \(error)"))
    }
  }
  
  /**
   * Starts the AssetWriter session at the given source time.
   * Old queued buffers may be written now.
   */
  func start(at time: CMTime) {
    lock.wait()
    defer { lock.signal() }
    
    ReactLogger.log(level: .info, message: "Starting AVAssetWriter Session at \(time.seconds)...")
    startTime = time
    assetWriter.startSession(atSourceTime: time)
  }
  
  /**
   * Stops the AssetWriter at the given source time.
   * Buffers after this time may no longer be written to the file.
   */
  func stop(at time: CMTime) {
    lock.wait()
    defer { lock.signal() }
    
    ReactLogger.log(level: .info, message: "Stopping AVAssetWriter Session at \(time.seconds)...")
    stopTime = time
    assetWriter.endSession(atSourceTime: time)
  }
  
  private func createInput(mediaType: AVMediaType, outputSettings settings: [String: Any]?, sourceFormatHint format: CMFormatDescription?) -> Input {
    if let settings = settings {
      ReactLogger.log(level: .info, message: "Initializing \(mediaType) AssetWriter with settings: \(settings.description)")
    } else {
      ReactLogger.log(level: .info, message: "Initializing \(mediaType) AssetWriter default settings...")
    }
    
    let writerInput = AVAssetWriterInput(mediaType: mediaType, outputSettings: settings, sourceFormatHint: format)
    writerInput.expectsMediaDataInRealTime = true
    assetWriter.add(writerInput)
    ReactLogger.log(level: .info, message: "Initialized \(mediaType) AssetWriter.")
    return Input(wrapping: writerInput, assetWriter: self)
  }
  
  /**
   * Initializes the Audio AVAssetWriterInput (`audio`)
   */
  func initializeAudioWriter(withSettings settings: [String: Any]?, format: CMFormatDescription) {
    lock.wait()
    defer { lock.signal() }
    
    audio = createInput(mediaType: .audio, outputSettings: settings, sourceFormatHint: format)
  }
  
  /**
   * Initializes the Video AVAssetWriterInput (`video`)
   */
  func initializeVideoWriter(withSettings settings: [String: Any]) {
    lock.wait()
    defer { lock.signal() }
    
    video = createInput(mediaType: .video, outputSettings: settings, sourceFormatHint: nil)
  }
  
  func append(buffer: CMSampleBuffer, type: BufferType) throws {
    guard let initTime else {
      // AssetWriter has not yet prepared
      throw WriteError.notYetReady
    }
    
    let timestamp = CMSampleBufferGetPresentationTimeStamp(buffer)
    guard timestamp >= initTime else {
      // Timestamp was before we even initialized the AVAssetWriter. Skip it
      return
    }
    
    if !isStarted && type == .video {
      // We haven't started the session yet and the first valid video buffer arrived. Start the session now!
      start(at: timestamp)
    }
    
    let writer = type == .video ? video : audio
    guard let writer else {
      // Writer was not initialized.
      throw WriteError.typeNotInitialized(type: type)
    }
    
    let successful = writer.append(buffer: buffer)
    if !successful {
      // Failed to write this buffer!
      throw WriteError.failedToWrite(assetWriterError: assetWriter.error)
    }
  }
  
  /**
   Stops the AssetWriters and calls the completion callback.
   */
  func finish(callback: @escaping (_ status: AVAssetWriter.Status, _ error: Error?) -> Void) {
    lock.wait()
    defer {
      lock.signal()
    }

    ReactLogger.log(level: .info, message: "Stopping AssetWriter with status \"\(assetWriter.status.descriptor)\"...")

    guard assetWriter.status == .writing else {
      callback(assetWriter.status, assetWriter.error)
      return
    }

    audio?.stop()
    video?.stop()
    assetWriter.finishWriting {
      callback(self.assetWriter.status, self.assetWriter.error)
    }
  }
  
  enum WriteError: Error {
    case failedToWrite(assetWriterError: Error?)
    case notYetReady
    case typeNotInitialized(type: BufferType)
  }
  
  
  /**
   * Represents an Input, either video or audio, for the QueueableAssetWriter.
   */
  class Input {
    private weak var assetWriter: QueueableAssetWriter?
    private let assetWriterInput: AVAssetWriterInput
    private var queue: [CMSampleBuffer] = []
    private let lock = DispatchSemaphore(value: 1)
    
    init(wrapping assetWriterInput: AVAssetWriterInput, assetWriter: QueueableAssetWriter) {
      self.assetWriterInput = assetWriterInput
      self.assetWriter = assetWriter
    }
    
    /**
     * Writes the buffer to the AssetWriter input and returns a boolean indicating if everything went successful (either the buffer has been written, or it should not be written)
     * In the case that this method returns false, it shall be called again later.
     */
    private func writeBuffer(buffer: CMSampleBuffer) -> Bool {
      let timestamp = CMSampleBufferGetPresentationTimeStamp(buffer)
      guard let assetWriter = assetWriter,
            let startTime = assetWriter.startTime,
            timestamp >= startTime else {
        // Buffer has a timestamp way earlier before we even started the session, skip it.
        return true
      }
      
      guard assetWriterInput.isReadyForMoreMediaData else {
        return false
      }
      
      // Write it!
      return assetWriterInput.append(buffer)
    }
    
    private func queueBuffer(buffer: CMSampleBuffer) {
      lock.wait()
      defer {
        lock.signal()
      }
      
      queue.append(buffer)
    }
    
    private func dequeueAllBuffers() {
      lock.wait()
      defer {
        lock.signal()
      }
      
      for i in 0..<queue.count {
        let buffer = queue[i]
        let success = writeBuffer(buffer: buffer)
        if success {
          // It can be dequeued now
          queue.remove(at: i)
        }
      }
    }
    
    func append(buffer: CMSampleBuffer) -> Bool {
      guard let assetWriter = assetWriter,
            assetWriter.isStarted else {
        // Asset Writer has not yet been started! Queue this buffer
        queueBuffer(buffer: buffer)
        return true
      }
      
      if !queue.isEmpty {
        // We can now dequeue old buffers
        dequeueAllBuffers()
      }
      // Write this buffer
      return writeBuffer(buffer: buffer)
    }
    
    func stop() {
      assetWriterInput.markAsFinished()
    }
  }
}
