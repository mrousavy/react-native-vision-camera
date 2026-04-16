///
/// AVCaptureDevice+withLock.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureDevice {
  /**
   * Runs the given `closure` under an `AVCaptureDevice` lock, on
   * the device's `DispatchQueue`.
   * Once the `closure` returns, the `AVCaptureDevice` will be unlocked.
   * To actually resolve the returned `Promise<T>`, the `closure` must call
   * `resolve` (argument #1), or `reject` (argument #2).
   */
  func withLock(
    _ queue: DispatchQueue,
    _ closure:
      @escaping (
        _ resolve: @escaping () -> Void,
        _ reject: @escaping (Error) -> Void
      ) throws -> Void
  ) -> Promise<Void> {
    let promise = Promise<Void>()

    queue.async {
      do {
        // 1. Lock the device
        try self.lockForConfiguration()
        defer {
          // 3. Once the closure suspended, we can unlock the device again
          self.unlockForConfiguration()
        }
        // 2. Call the closure and pass a `completion` callback
        try closure(promise.resolve, promise.reject)
      } catch let error {
        promise.reject(withError: error)
      }
    }

    return promise
  }

  /**
   * Runs the given `closure` under an `AVCaptureDevice` lock, on
   * the device's `DispatchQueue`.
   * Once the `closure` returns, the `AVCaptureDevice` will be unlocked.
   * To actually resolve the returned `Promise<T>`, the `closure` must call
   * the `completion` handler (argument #1).
   */
  func withLock(
    _ queue: DispatchQueue, _ closure: @escaping (_ completion: @escaping () -> Void) throws -> Void
  ) -> Promise<Void> {
    return self.withLock(queue) { resolve, _ in
      try closure(resolve)
    }
  }
  /**
   * Runs the given `closure` under an `AVCaptureDevice` lock, on
   * the device's `DispatchQueue`.
   * Once the `closure` returns, the `Promise<T>` will be resolved.
   */
  func withLock(_ queue: DispatchQueue, _ closure: @escaping () throws -> Void) -> Promise<Void> {
    return Promise.parallel(queue) {
      try self.lockForConfiguration()
      defer { self.unlockForConfiguration() }
      try closure()
    }
  }
}
