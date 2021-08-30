//
//  FrameProcessorPerformanceDataCollector.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 30.08.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import Foundation

// MARK: - PerformanceSampleCollection

struct PerformanceSampleCollection {
  var endPerformanceSampleCollection: () -> Void

  init(end: @escaping () -> Void) {
    endPerformanceSampleCollection = end
  }
}

// MARK: - FrameProcessorPerformanceDataCollector

class FrameProcessorPerformanceDataCollector {
  let maxSamplesSize: Int
  private var performanceSamples: [Double]
  private var counter = 0
  private var lastEvaluation = -1

  var averageExecutionTimeSeconds: Double {
    let sum = performanceSamples.reduce(0, +)
    let average = sum / Double(performanceSamples.count)

    lastEvaluation = counter

    return average
  }

  var hasEnoughData: Bool {
    return counter >= maxSamplesSize
  }

  var isReadyForNewEvaluation: Bool {
    return hasEnoughData && counter % maxSamplesSize == 0 && lastEvaluation != counter
  }

  init(maxSamplesSize: Int) {
    self.maxSamplesSize = maxSamplesSize
    performanceSamples = Array(repeating: 0, count: maxSamplesSize)
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
