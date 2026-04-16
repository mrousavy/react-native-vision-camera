//
//  NativeDepth.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.11.25.
//

import AVFoundation
import Foundation

public protocol NativeDepth: AnyObject {
  var depthData: AVDepthData? { get }
  var metadata: MediaSampleMetadata { get }
}
