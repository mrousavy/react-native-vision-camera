//
//  AVCaptureOutput+supportsVirtualRotation.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.06.24.
//

import AVFoundation
import Foundation

extension AVCaptureOutput {
  /**
   Gets whether this capture connection supports setting output orientation/rotation without a performance overhead ("virtual").

   These outputs support "virtual" orientation:
   - AVCapturePhotoOutput supports virtual orientation by setting EXIF tags -> no performance overhead
   - AVCaptureMovieFileOutput supports virtual orientation by setting EXIF tags -> no performance overhead

   These outputs do not support "virtual" orientation and have to manually handle orientation client-side:
   - AVCaptureVideoDataOutput does not support virtual orientation, instead it physically rotates buffers -> performance overhead
   */
  var supportsVirtualRotation: Bool {
    return self is AVCapturePhotoOutput || self is AVCaptureMovieFileOutput
  }
}
