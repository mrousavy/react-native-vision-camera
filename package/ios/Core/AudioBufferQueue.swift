//
//  AudioBufferQueue.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 27.11.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import Foundation
import AVFoundation

class AudioBufferQueue {
  private var queue: [CMSampleBuffer] = []
  
  
  func queue(buffer: CMSampleBuffer) {
    queue.append(buffer)
  }
}
