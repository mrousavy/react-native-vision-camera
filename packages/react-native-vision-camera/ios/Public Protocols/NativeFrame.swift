//
//  NativeFrame.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.11.25.
//

import Foundation
import AVFoundation

public protocol NativeFrame {
  var sampleBuffer: CMSampleBuffer? { get }
  var metadata: MediaSampleMetadata { get }
}
