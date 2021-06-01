//
//  AVAudioSession+trySetCategory.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 01.06.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension AVAudioSession {
  /**
   Calls [setCategory] if the given category or options are not equal to the currently set category and options.
   */
  func setCategoryIfNotSet(_ category: AVAudioSession.Category, options: AVAudioSession.CategoryOptions = []) throws {
    print("YEEET TRY Setting category")
    if self.category != category || self.categoryOptions.rawValue != options.rawValue {
      print("YEEET Setting category")
      try self.setCategory(category, options: options)
    }
  }
}
