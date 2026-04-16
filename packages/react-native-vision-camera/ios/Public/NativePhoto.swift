//
//  NativePhoto.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.11.25.
//

import AVFoundation
import Foundation

public protocol NativePhoto: AnyObject {
  var photo: AVCapturePhoto { get }
  var metadata: MediaSampleMetadata { get }
}
