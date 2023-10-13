//
//  CameraSessionDelegate.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 11.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

/**
 A listener for [CameraSession] events
 */
protocol CameraSessionDelegate: AnyObject {
  /**
   Called when there is a Runtime Error in the [CameraSession]
   */
  func onError(_ error: CameraError)
  /**
   Called when the [CameraSession] successfully initializes
   */
  func onSessionInitialized()
  /**
   Called for every frame (if video or frameProcessor is enabled)
   */
  func onFrame(sampleBuffer: CMSampleBuffer)
  /**
   Called whenever a QR/Barcode has been scanned. Only if the CodeScanner Output is enabled
   */
  func onCodeScanned(codes: [CameraSession.Code])
}
