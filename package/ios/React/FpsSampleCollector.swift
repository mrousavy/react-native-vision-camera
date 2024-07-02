//
//  FpsSampleCollector.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 22.04.24.
//

import Foundation

final class FpsSampleCollector {
  private var timestamps: [UInt64] = []
  private var timer: Timer?
  weak var delegate: FpsSampleCollectorDelegate?

  func start() {
    timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true, block: { [weak self] timer in
      guard let self else {
        timer.invalidate()
        return
      }
      guard let delegate = self.delegate else { return }
      delegate.onAverageFpsChanged(averageFps: self.averageFps)
    })
  }

  func stop() {
    timer?.invalidate()
    timer = nil
  }

  /**
   Add a new timestamp to the FPS samples.
   */
  func onTick() {
    let now = DispatchTime.now().uptimeNanoseconds
    timestamps.append(now)

    // filter out any timestamps that are older than 1 second
    timestamps = timestamps.filter { timestamp in
      let differenceMs = (now - timestamp) / 1_000_000
      return differenceMs < 1000
    }
  }

  /**
   Gets the current average FPS.
   */
  var averageFps: Double {
    guard let firstTimestamp = timestamps.first,
          let lastTimestamp = timestamps.last else {
      return 0.0
    }

    let totalDurationMs = (lastTimestamp - firstTimestamp) / 1_000_000
    let averageFrameDurationMs = Double(totalDurationMs) / Double(timestamps.count - 1)

    return 1000.0 / averageFrameDurationMs
  }
}
