//
//  AV+PreviewResizeMode.swift
//  Pods
//
//  Created by Marc Rousavy on 23.01.26.
//

import AVFoundation

extension PreviewResizeMode {
  func toAVLayerVideoGravity() -> AVLayerVideoGravity {
    switch self {
    case .cover:
      return .resizeAspectFill
    case .contain:
      return .resizeAspect
    }
  }
}
