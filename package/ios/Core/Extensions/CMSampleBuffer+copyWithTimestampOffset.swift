//
//  CMSampleBuffer+copyWithTimestampOffset.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 08.06.24.
//

import CoreMedia
import Foundation

// MARK: - TimestampAdjustmentError

enum TimestampAdjustmentError: Error {
  case failedToCopySampleBuffer(status: OSStatus)
  case sampleBufferCopyIsNil
  case failedToGetTimingInfo(status: OSStatus)
  case noTimingEntriesNeeded
}

private let kSampleBufferError_NoError: OSStatus = 0

extension CMSampleBuffer {
  /**
   Returns a copy of the current CMSampleBuffer with the timing info adjusted by the given offset.
   The decode and presentation timestamps will be shifted by the given offset.
   The actual pixel buffer will not be copied, only metadata information will.
   */
  func copyWithTimestampOffset(_ offset: CMTime) throws -> CMSampleBuffer {
    let samplesCount = CMSampleBufferGetNumSamples(self)
    let timingInfo = UnsafeMutablePointer<CMSampleTimingInfo>.allocate(capacity: samplesCount)
    var entriesNeeded: Int = samplesCount
    let getResult = CMSampleBufferGetSampleTimingInfoArray(self,
                                                           entryCount: samplesCount,
                                                           arrayToFill: timingInfo,
                                                           entriesNeededOut: &entriesNeeded)
    guard getResult == kSampleBufferError_NoError else {
      // failed to get timing info
      throw TimestampAdjustmentError.failedToGetTimingInfo(status: getResult)
    }
    guard entriesNeeded > 0 else {
      // there are no entries in the timing info - we cannot adjust anything
      throw TimestampAdjustmentError.noTimingEntriesNeeded
    }

    for i in 0 ... samplesCount {
      // swiftlint:disable shorthand_operator
      timingInfo[i].decodeTimeStamp = timingInfo[i].decodeTimeStamp + offset
      timingInfo[i].presentationTimeStamp = timingInfo[i].presentationTimeStamp + offset
      // swiftlint:enable shorthand_operator
    }

    var newBuffer: CMSampleBuffer?
    let copyResult = CMSampleBufferCreateCopyWithNewTiming(allocator: nil,
                                                           sampleBuffer: self,
                                                           sampleTimingEntryCount: entriesNeeded,
                                                           sampleTimingArray: timingInfo,
                                                           sampleBufferOut: &newBuffer)
    guard copyResult == kSampleBufferError_NoError else {
      throw TimestampAdjustmentError.failedToCopySampleBuffer(status: copyResult)
    }
    guard let newBuffer else {
      throw TimestampAdjustmentError.sampleBufferCopyIsNil
    }
    return newBuffer
  }
}
