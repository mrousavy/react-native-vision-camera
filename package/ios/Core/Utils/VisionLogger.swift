//
//  VisionLogger.swift
//  mrousavy
//
//  Created by Marc Rousavy on 15.12.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import Foundation

// MARK: - LogLevel

enum LogLevel: String {
  case debug
  case info
  case warning
  case error
}

// MARK: - VisionLogger

enum VisionLogger {
  static var staticFormatter: DateFormatter?
  static var formatter: DateFormatter {
    guard let staticFormatter else {
      let formatter = DateFormatter()
      formatter.dateFormat = "HH:mm:ss.SSS"
      self.staticFormatter = formatter
      return formatter
    }
    return staticFormatter
  }

  /**
   * Log a message to the console in the format of `VisionCamera.[caller-function-name]: [message]`
   */
  @inlinable
  static func log(level: LogLevel,
                  message: String,
                  _ function: String = #function) {
    let now = Date()
    let time = formatter.string(from: now)
    print("\(time): [\(level.rawValue)] 📸 VisionCamera.\(function): \(message)")
  }
}
