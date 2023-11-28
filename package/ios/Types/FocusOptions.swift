//
//  FocusOptions.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 27.11.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import Foundation
import AVFoundation

struct FocusOptions: Equatable {
  let point: CGPoint
  let modes: Mode
  
  struct Mode: OptionSet {
    let rawValue: Int
    
    static let af = Mode(rawValue: 1 << 0)
    static let ae = Mode(rawValue: 1 << 1)
    static let awb = Mode(rawValue: 1 << 2)
    
    static func from(jsValue: String) throws -> Mode {
      switch (jsValue) {
      case "af":
        return .af
      case "ae":
        return .ae
      case "awb":
        return .awb
      default:
        throw CameraError.parameter(.invalid(unionName: "modes", receivedValue: jsValue))
      }
    }
    
    static func from(jsValue: [String]) throws -> Mode {
      var modes: Mode = []
      try jsValue.forEach { value in
        let mode = try Mode.from(jsValue: value)
        modes.insert(mode)
      }
      return modes
    }
  }
  
  init(point: CGPoint, modes: Mode) {
    self.point = point
    self.modes = modes
  }

  init(fromJsValue dictionary: NSDictionary) throws {
    if let point = dictionary["point"] as? [String: Any],
       let x = point["x"] as? NSNumber,
       let y = point["y"] as? NSNumber {
      self.point = CGPointMake(x.doubleValue, y.doubleValue)
    } else {
      throw CameraError.parameter(.invalid(unionName: "point", receivedValue: dictionary.description))
    }
    
    if let modes = dictionary["modes"] as? [String] {
      self.modes = try Mode.from(jsValue: modes)
    } else {
      self.modes = [.ae, .awb, .af]
    }
  }
}
