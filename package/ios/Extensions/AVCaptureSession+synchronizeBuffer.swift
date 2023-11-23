//
//  AVCaptureSession+synchronizeBuffer.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 22.11.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension AVCaptureSession {
  /**
   Returns the clock that is used by this AVCaptureSession.
   */
  var clock: CMClock {
    if #available(iOS 15.4, *), let synchronizationClock {
      return synchronizationClock
    }

    return masterClock ?? CMClockGetHostTimeClock()
  }

  /**
   Synchronizes a Buffer received from this [AVCaptureSession] to the timebase of the other given [AVCaptureSession].
   */
  func synchronizeBuffer(_ buffer: CMSampleBuffer, toSession to: AVCaptureSession) {
    let timestamp = CMSampleBufferGetPresentationTimeStamp(buffer)
    let synchronizedTimestamp = CMSyncConvertTime(timestamp, from: clock, to: to.clock)
    CMSampleBufferSetOutputPresentationTimeStamp(buffer, newValue: synchronizedTimestamp)
  }
}
