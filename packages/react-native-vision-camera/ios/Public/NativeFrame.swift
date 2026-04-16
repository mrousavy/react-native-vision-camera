//
//  NativeFrame.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.11.25.
//

import AVFoundation
import Foundation

public protocol NativeFrame: AnyObject {
  var sampleBuffer: CMSampleBuffer? { get }
  var metadata: MediaSampleMetadata { get }
}
