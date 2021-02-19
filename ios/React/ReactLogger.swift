//
//  ReactLogger.swift
//  Cuvent
//
//  Created by Marc Rousavy on 15.12.20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation

let context = "Camera"

enum ReactLogger {
  static func log(level: RCTLogLevel, message: String, alsoLogToJS: Bool = false, file: String = #file, lineNumber: Int = #line) {
    RCTDefaultLogFunction(level, RCTLogSource.native, file, lineNumber as NSNumber, "\(context): \(message)")
    if alsoLogToJS {
      RCTDefaultLogFunction(level, RCTLogSource.javaScript, file, lineNumber as NSNumber, "\(context): \(message)")
    }
  }

  static func logJS(level: RCTLogLevel, message: String, file: String = #file, lineNumber: Int = #line) {
    RCTDefaultLogFunction(level, RCTLogSource.javaScript, file, lineNumber as NSNumber, "\(context): \(message)")
  }
}
