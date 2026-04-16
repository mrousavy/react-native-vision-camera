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
