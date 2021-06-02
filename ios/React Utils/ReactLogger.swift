//
//  ReactLogger.swift
//  Cuvent
//
//  Created by Marc Rousavy on 15.12.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import Foundation

let context = "VisionCamera"

// MARK: - ReactLogger

enum ReactLogger {
  static var ConsoleLogFunction: ConsoleLogFunction?

  @inlinable
  static func log(level: RCTLogLevel,
                  message: String,
                  alsoLogToJS: Bool = false,
                  _ file: String = #file,
                  _ lineNumber: Int = #line,
                  _ function: String = #function) {
    #if DEBUG
      if alsoLogToJS, let log = ConsoleLogFunction {
        log(level, "📷 VisionCamera: \(message)")
      }
      RCTDefaultLogFunction(level, RCTLogSource.native, file, lineNumber as NSNumber, "\(context).\(function): \(message)")
    #endif
  }
}
