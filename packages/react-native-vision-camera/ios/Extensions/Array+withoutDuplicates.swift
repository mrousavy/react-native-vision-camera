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

extension Array {
  func withoutDuplicates(isEqual: (Element, Element) -> Bool) -> [Element] {
    var result: [Element] = []
    for element in self {
      let exists = result.contains { isEqual(element, $0) }
      if !exists {
        result.append(element)
      }
    }
    return result
  }
}
