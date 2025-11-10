///
/// MediaSubType+hidden.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import NitroModules
import AVFoundation
import Foundation

extension CMFormatDescription.MediaSubType {
  static let hdis = CMFormatDescription.MediaSubType(string: "hdis")
  static let fdis = CMFormatDescription.MediaSubType(string: "fdis")
  
  static let hdep = CMFormatDescription.MediaSubType(string: "hdep")
  static let fdep = CMFormatDescription.MediaSubType(string: "fdep")
}
