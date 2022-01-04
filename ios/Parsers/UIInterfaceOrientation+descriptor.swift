//
//  UIInterfaceOrientation+descriptor.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 04.01.22.
//  Copyright © 2022 mrousavy. All rights reserved.
//

import Foundation
import UIKit

extension UIInterfaceOrientation {
  init(withString string: String) throws {
    switch string {
    case "portrait":
      self = .portrait
      return
    case "portraitUpsideDown":
      self = .portraitUpsideDown
      return
    case "landscapeLeft":
      self = .landscapeLeft
      return
    case "landscapeRight":
      self = .landscapeRight
      return
    default:
      throw EnumParserError.invalidValue
    }
  }
}
