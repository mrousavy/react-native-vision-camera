///
/// HybridNativeThread.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules

class HybridNativeThread: HybridNativeThreadSpec {
  let queue: DispatchQueue

  init(queue: DispatchQueue) {
    self.queue = queue
    super.init()
  }
  
  var id: String {
    return queue.label
  }
  
  func runOnThread(task: @escaping () -> Void) throws {
    queue.async(execute: task)
  }
}
