//
//  Variant_NullType_Double+AutoReset.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 21.01.26.
//

extension Variant_NullType_Double {
  func toAutoReset() -> MeteringTask.AutoReset {
    switch self {
    case .first:
      return .never
    case .second(let seconds):
      return .after(seconds: seconds)
    }
  }
}
