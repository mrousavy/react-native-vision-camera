//
//  NativeFrame.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.11.25.
//

import Foundation
import AVFoundation

protocol NativeFrame {
  var orientation: Orientation { get }
  var sampleBuffer: CMSampleBuffer? { get }
}
