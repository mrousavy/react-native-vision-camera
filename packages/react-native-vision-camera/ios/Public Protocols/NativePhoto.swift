//
//  NativePhoto.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.11.25.
//

import Foundation
import AVFoundation

public protocol NativePhoto {
  var photo: AVCapturePhoto { get }
  var metadata: MediaSampleMetadata { get }
}
