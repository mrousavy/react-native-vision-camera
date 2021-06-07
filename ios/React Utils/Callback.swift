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
  init(_ callback: @escaping RCTResponseSenderBlock) {
    self.callback = callback
  }

  func reject(error: CameraError, cause: NSError?) {
    callback([NSNull(), makeReactError(error, cause: cause)])
  }

  func reject(error: CameraError) {
    reject(error: error, cause: nil)
  }

  func resolve(_ value: Any?) {
    callback([value, NSNull()])
  }

  func resolve() {
    resolve(nil)
  }

  // MARK: Private

  private let callback: RCTResponseSenderBlock
}
