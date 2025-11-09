//
//  NativeDepth.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.11.25.
//

import Foundation
import AVFoundation

public protocol NativeDepth {
  var orientation: Orientation { get }
  var depthData: AVDepthData? { get }
}
