//
//  Callback.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 07.06.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import Foundation

/**
 Represents a callback to JavaScript. Syntax is the same as with Promise.
 */
class Callback {
  private var hasCalled = false
  private let callback: RCTResponseSenderBlock

  init(_ callback: @escaping RCTResponseSenderBlock) {
    self.callback = callback
  }

  func reject(error: CameraError, cause: NSError?) {
    guard !hasCalled else { return }

    callback([NSNull(), makeReactError(error, cause: cause)])
    hasCalled = true
  }

  func reject(error: CameraError) {
    guard !hasCalled else { return }

    reject(error: error, cause: nil)
    hasCalled = true
  }

  func resolve(_ value: Any) {
    guard !hasCalled else { return }

    callback([value, NSNull()])
    hasCalled = true
  }

  func resolve() {
    guard !hasCalled else { return }

    resolve(NSNull())
    hasCalled = true
  }
}
