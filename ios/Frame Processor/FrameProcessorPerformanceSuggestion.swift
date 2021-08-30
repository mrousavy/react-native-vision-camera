//
//  FrameProcessorPerformanceSuggestion.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 30.08.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import Foundation

// MARK: - PerformanceSuggestionType

enum PerformanceSuggestionType: String {
  case canUseHigherFps = "can-use-higher-fps"
  case shouldUseLowerFps = "should-use-lower-fps"
}

// MARK: - FrameProcessorPerformanceSuggestion

struct FrameProcessorPerformanceSuggestion {
  let type: PerformanceSuggestionType
  let suggestedFps: Double

  init(type: PerformanceSuggestionType, suggestedFps: Double) {
    self.type = type
    self.suggestedFps = suggestedFps
  }
}
