//
//  NativeScannedObject.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.02.26.
//

import AVFoundation

public protocol NativeScannedObject: AnyObject {
  associatedtype ObjectType: AVMetadataObject
  /**
   * Get the underlying `AVMetadataObject`.
   */
  var object: ObjectType { get }
}
