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
  /**
   * Represents an Input, either video or audio, for the QueueableAssetWriter.
   */
  class Input {
    private weak var assetWriter: AVAssetWriter?
    private let assetWriterInput: AVAssetWriterInput
    private var queue: [CMSampleBuffer] = []
    private let lock = DispatchSemaphore(value: 1)
    
    private var startTimestamp: CMTime? = nil
    
    init(wrapping assetWriterInput: AVAssetWriterInput, assetWriter: AVAssetWriter) {
      self.assetWriterInput = assetWriterInput
      self.assetWriter = assetWriter
    }
    
    func notifySessionStartedAt(time: CMTime) {
      startTimestamp = time
    }
    
    /**
     * Writes the buffer to the AssetWriter input and returns a boolean indicating if everything went successful (either the buffer has been written, or it should not be written)
     * In the case that this method returns false, it shall be called again later.
     */
    private func writeBuffer(buffer: CMSampleBuffer) -> Bool {
      let timestamp = CMSampleBufferGetPresentationTimeStamp(buffer)
      guard let startTimestamp = startTimestamp,
            timestamp >= startTimestamp else {
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
      if startTimestamp == nil {
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
    
    func finish() {
      assetWriterInput.markAsFinished()
    }
  }
}
