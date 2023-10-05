//
//  AVCaptureDevice.Format+isEqualTo.swift
//  mrousavy
//
//  Created by Marc Rousavy on 15.01.21.
//  Copyright © 2021 mrousavy. All rights reserved.
//

import AVFoundation

extension AVCaptureDevice.Format {
  /**
   * Checks whether this AVCaptureDevice.Format is equal to the given JS Format (NSDictionary, JSON Object) .
   * The `jsFormat` dictionary must be of type `CameraDeviceFormat` (from `CameraDevice.ts`)
   */
  func isEqualTo(jsFormat: NSDictionary) -> Bool {
    return jsFormat.isEqual(to: self.toDictionary())
  }
}
