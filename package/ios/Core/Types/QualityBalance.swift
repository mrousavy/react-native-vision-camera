//
//  QualityBalance.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 26.02.24.
//  Copyright © 2024 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

@frozen
enum QualityBalance: String, JSUnionValue {
  case speed
  case balanced
  case quality

  init(jsValue: String) throws {
    if let parsed = QualityBalance(rawValue: jsValue) {
      self = parsed
    } else {
      throw CameraError.parameter(.invalid(unionName: "qualityBalance", receivedValue: jsValue))
    }
  }

  var jsValue: String {
    return rawValue
  }
}
