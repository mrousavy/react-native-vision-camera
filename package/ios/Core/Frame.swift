//
//  Frame.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 12.07.24.
//

import Foundation
import AVFoundation

/**
 Represents a Camera Frame. This holds a CMSampleBuffer, and orientation information.
 */
@objc
public final class Frame: NSObject {
  /**
   The actual CMSampleBuffer.
   */
  let sampleBuffer: CMSampleBuffer
  /**
   The actual CVPixelBuffer.
   */
  let pixelBuffer: CVPixelBuffer
  /**
   The orientation of the CMSampleBuffer relative to the device's native portrait orientation.
   */
  let orientation: Orientation
  /**
   Whether the CMSampleBuffer is mirrored alongside the vertical axis, or not.
   */
  let isMirrored: Bool
  
  init(withBuffer sampleBuffer: CMSampleBuffer, orientation: Orientation, isMirrored: Bool) {
    super.init()
    self.sampleBuffer = sampleBuffer
    self.orientation = orientation
    self.isMirrored = isMirrored
    
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
      fatalError("The given CMSampleBuffer does not hold a valid CVPixelBuffer!")
    }
    self.pixelBuffer = pixelBuffer
  }
  
  /**
   The Frame's actual pixel format.
   See kCVPixelFormatType_* in CVPixelBuffer.h for more information.
   */
  var rawPixelFormat: OSType? {
    guard let format = CMSampleBufferGetFormatDescription(sampleBuffer) else {
      return nil
    }
    return CMFormatDescriptionGetMediaSubType(format)
  }
  
  /**
   The Frame's high-level Pixel Format.
   */
  var pixelFormat: PixelFormat {
    guard let rawPixelFormat = rawPixelFormat else {
      return .unknown
    }
    return PixelFormat(mediaSubType: rawPixelFormat)
  }
  
  var pixelFormatString: String {
    return pixelFormat.jsValue
  }
  
  /**
   Whether this Frame still holds a valid CMSampleBuffer or not
   */
  var isValid: Bool {
    return CMSampleBufferIsValid(sampleBuffer)
  }
  
  /**
   The width of the Frame, in pixels.
   */
  var width: Int {
    return CVPixelBufferGetWidth(pixelBuffer)
  }
  
  /**
   The height of the Frame, in pixels.
   */
  var height: Int {
    return CVPixelBufferGetWidth(pixelBuffer)
  }
  
  /**
   The presentation timestamp of the Frame, in milliseconds.
   */
  var timestamp: Double {
    let timestamp = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
    return timestamp.seconds * 1000
  }
  
  /**
   The bytes per row of the single plane Frame.
   */
  var bytesPerRow: Int {
    return CVPixelBufferGetBytesPerRow(pixelBuffer)
  }
  
  /**
   The number of planes this Frame holds.
   For RGB(A), this might be a single plane.
   For YUV, this might be bi-planar or even tri-planar.
   */
  var planesCount: Int {
    return CVPixelBufferGetPlaneCount(pixelBuffer)
  }
}
