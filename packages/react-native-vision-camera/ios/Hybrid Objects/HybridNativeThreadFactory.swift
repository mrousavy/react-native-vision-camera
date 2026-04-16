///
/// HybridNativeThreadFactory.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules

final class HybridNativeThreadFactory: HybridNativeThreadFactorySpec {
  func createNativeThread(name: String) throws -> any HybridNativeThreadSpec {
    let queue = DispatchQueue(label: name)
    return HybridNativeThread(queue: queue)
  }
}
