//
//  FrameProcessorPerformanceSuggestion.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 30.08.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import Foundation

enum PerformanceSuggestionMode: String {
  case canUseHigherFps = "can-use-higher-fps"
  case shouldUseLowerFps = "should-use-lower-fps"
}

struct FrameProcessorPerformanceSuggestion {
  let mode: PerformanceSuggestionMode
  let suggestedFps: Double
  
  init(mode: PerformanceSuggestionMode, suggestedFps: Double) {
    self.mode = mode
    self.suggestedFps = suggestedFps
  }
}
