//
//  WeakArray.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.01.26.
//

import Foundation

private final class Weak<T: AnyObject> {
  weak var value: T?
  init(_ value: T) {
    self.value = value
  }
}

struct WeakArray<T: AnyObject> {
  private var storage: [Weak<T>] = []

  mutating func append(_ object: T) {
    storage.append(Weak(object))
  }

  private mutating func removeDeallocated() {
    storage.removeAll { $0.value == nil }
  }

  mutating func values() -> [T] {
    removeDeallocated()
    return storage.compactMap { $0.value }
  }
}
