///
/// simd_float+toDoubleArray.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension simd_float3x3 {
  /**
   * Converts a 3x3 Matrix to a `[Double]`.
   */
  func toDoubleArray() -> [Double] {
    var values = [Double]()
    values.reserveCapacity(3 * 3)
    for row in 0..<3 {
      for col in 0..<3 {
        let value = self[row, col]
        values.append(Double(value))
      }
    }
    return values
  }
}

extension simd_float4x3 {
  /**
   * Converts a 4x3 Matrix to a `[Double]`.
   */
  func toDoubleArray() -> [Double] {
    var values = [Double]()
    values.reserveCapacity(4 * 3)
    for row in 0..<4 {
      for col in 0..<3 {
        let value = self[row, col]
        values.append(Double(value))
      }
    }
    return values
  }
}
