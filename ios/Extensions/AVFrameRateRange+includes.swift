//
//  AVFrameRateRange+includes.swift
//  Cuvent
//
//  Created by Marc Rousavy on 15.01.21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import AVFoundation

extension AVFrameRateRange {
  func includes(fps: Double) -> Bool {
    return fps >= minFrameRate && fps <= maxFrameRate
  }
}
