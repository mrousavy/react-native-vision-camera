///
/// Array+withoutDuplicates.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation

extension Array where Element: Equatable {
  func withoutDuplicates() -> [Element] {
    var result: [Element] = []
    for element in self where !result.contains(element) {
      result.append(element)
    }
    return result
  }
}

extension Array where Element: Hashable {
  func withoutDuplicates() -> [Element] {
    var seen = Set<Element>()
    seen.reserveCapacity(count)

    var result: [Element] = []
    result.reserveCapacity(count)

    for element in self where seen.insert(element).inserted {
      result.append(element)
    }
    return result
  }
}
