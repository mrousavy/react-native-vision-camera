//
//  SkiaPreviewDisplayLink.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 19.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import Foundation

class SkiaPreviewDisplayLink {
  private var displayLink: CADisplayLink?
  private let callback: (_ timestamp: Double) -> Void

  init(callback: @escaping (_ timestamp: Double) -> Void) {
    self.callback = callback
  }

  deinit {
    stop()
  }

  @objc
  func update(_ displayLink: CADisplayLink) {
    callback(displayLink.timestamp)
  }

  func start() {
    if displayLink == nil {
      let displayLink = CADisplayLink(target: self, selector: #selector(update))
      let queue = DispatchQueue(label: "mrousavy/VisionCamera.preview",
                                qos: .userInteractive,
                                attributes: [],
                                autoreleaseFrequency: .inherit,
                                target: nil)
      queue.async {
        displayLink.add(to: .current, forMode: .common)
        self.displayLink = displayLink

        ReactLogger.log(level: .info, message: "Starting Skia Preview Display Link...")
        RunLoop.current.run()
        ReactLogger.log(level: .info, message: "Skia Preview Display Link stopped.")
      }
    }
  }

  func stop() {
    displayLink?.invalidate()
    displayLink = nil
  }
}
