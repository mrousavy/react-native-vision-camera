//
//  CMVideoDimensions+Equatable.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 08.04.26.
//

import CoreMedia

extension CMVideoDimensions: @retroactive Equatable {
  public static func == (lhs: CMVideoDimensions, rhs: CMVideoDimensions) -> Bool {
    lhs.width == rhs.width && lhs.height == rhs.height
  }
}
