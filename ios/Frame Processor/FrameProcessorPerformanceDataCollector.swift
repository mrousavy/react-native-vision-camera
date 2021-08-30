//
//  FrameProcessorPerformanceDataCollector.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 30.08.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import Foundation

class PerformanceSampleCollection {
  var endPerformanceSampleCollection: () -> Void
  
  init(end: @escaping () -> Void) {
    endPerformanceSampleCollection = end
  }
}

class FrameProcessorPerformanceDataCollector {
  private let maxSamplesSize: Int
  private var performanceSamples: [Double]
  private var counter = 0
  
  var averageExecutionTimeSeconds: Double {
    get {
      let sum = performanceSamples.reduce(0, +)
      let average = sum / Double(performanceSamples.count)
      return average
    }
  }
  var hasEnoughData: Bool {
    get {
      return counter >= maxSamplesSize
    }
  }
  var isReadyForNewEvaluation: Bool {
    get {
      return counter % maxSamplesSize == 0
    }
  }
  
  init(maxSamplesSize: Int) {
    self.maxSamplesSize = maxSamplesSize
    self.performanceSamples = []
    self.performanceSamples.reserveCapacity(maxSamplesSize)
  }
  
  func beginPerformanceSampleCollection() -> PerformanceSampleCollection {
    let begin = DispatchTime.now()
    
    return PerformanceSampleCollection {
      let end = DispatchTime.now()
      let seconds = Double(end.uptimeNanoseconds - begin.uptimeNanoseconds) / 1_000_000_000.0
      
      let index = self.counter % self.maxSamplesSize
      self.performanceSamples[index] = seconds
      self.counter += 1
    }
  }
}
