//
//  AVFileType+descriptor.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 01.05.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension AVFileType {
  init(withString string: String) {
    self.init(rawValue: string)
  }

  var descriptor: String {
    return rawValue
  }
}
