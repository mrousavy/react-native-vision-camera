//
//  CMVideoDimensions+toCGSize.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension CMVideoDimensions {
  func toCGSize() -> CGSize {
    return CGSize(width: Int(width), height: Int(height))
  }
}
