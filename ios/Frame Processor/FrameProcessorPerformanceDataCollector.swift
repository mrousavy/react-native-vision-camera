//
//  FrameProcessorPerformanceDataCollector.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 30.08.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import Foundation

// keep a maximum of `maxSampleSize` historical performance data samples cached.
private let maxSampleSize = 15

// MARK: - PerformanceSampleCollection

struct PerformanceSampleCollection {
  var endPerformanceSampleCollection: () -> Void

  init(end: @escaping () -> Void) {
    endPerformanceSampleCollection = end
  }
}

// MARK: - FrameProcessorPerformanceDataCollector

class FrameProcessorPerformanceDataCollector {
  private var performanceSamples: [Double] = []
  private var counter = 0
  private var lastEvaluation = -1

  var hasEnoughData: Bool {
    return !performanceSamples.isEmpty
  }

  var averageExecutionTimeSeconds: Double {
    let sum = performanceSamples.reduce(0, +)
    let average = sum / Double(performanceSamples.count)

    lastEvaluation = counter

    return average
  }

  func beginPerformanceSampleCollection() -> PerformanceSampleCollection {
    let begin = DispatchTime.now()

    return PerformanceSampleCollection {
      let end = DispatchTime.now()
      let seconds = Double(end.uptimeNanoseconds - begin.uptimeNanoseconds) / 1_000_000_000.0

      let index = self.counter % maxSampleSize

      if self.performanceSamples.count > index {
        self.performanceSamples[index] = seconds
      } else {
        self.performanceSamples.append(seconds)
      }

      self.counter += 1
    }
  }

  func clear() {
    counter = 0
    performanceSamples.removeAll()
  }
}
