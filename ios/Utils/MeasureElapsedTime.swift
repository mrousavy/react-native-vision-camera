//
//  MeasureElapsedTime.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 01.06.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import Foundation

@inlinable func measureElapsedTime<T>(label: String, _ code: () -> T) -> T {
  #if DEBUG
  let start = DispatchTime.now()
  defer {
    let end = DispatchTime.now()
    let nanoTime = end.uptimeNanoseconds - start.uptimeNanoseconds
    ReactLogger.log(level: .info, message: "\(label) took: \(Double(nanoTime) / 1_000_000)ms!")
  }
  #endif
  return code()
}
