//
//  AVCaptureSession+synchronizeBuffer.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 22.11.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import Foundation
import AVFoundation

extension AVCaptureSession {
  private var clock: CMClock {
    get {
      if #available(iOS 15.4, *), let synchronizationClock {
        return synchronizationClock
      }
      
      return masterClock ?? CMClockGetHostTimeClock()
    }
  }
  
  /**
   Synchronizes a Buffer received from this [AVCaptureSession] to the timebase of the other given [AVCaptureSession].
   */
  func synchronizeBuffer(_ buffer: CMSampleBuffer, toSession to: AVCaptureSession) {
    let timestamp = CMSampleBufferGetPresentationTimeStamp(buffer)
    let synchronizedTimestamp = CMSyncConvertTime(timestamp, from: self.clock, to: to.clock)
    ReactLogger.log(level: .info, message: "Synchronized Timestamp \(timestamp.seconds) -> \(synchronizedTimestamp.seconds)")
    CMSampleBufferSetOutputPresentationTimeStamp(buffer, newValue: synchronizedTimestamp)
  }
}
