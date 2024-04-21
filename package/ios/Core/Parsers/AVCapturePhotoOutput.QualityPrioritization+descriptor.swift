//
//  AVCapturePhotoOutput.QualityPrioritization+descriptor.swift
//  mrousavy
//
//  Created by Marc Rousavy on 15.12.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

@available(iOS 13.0, *)
extension AVCapturePhotoOutput.QualityPrioritization {
  init(fromQualityBalance qualityBalance: QualityBalance) {
    switch qualityBalance {
    case .speed:
      self = .speed
      return
    case .balanced:
      self = .balanced
      return
    case .quality:
      self = .quality
      return
    }
  }
}
