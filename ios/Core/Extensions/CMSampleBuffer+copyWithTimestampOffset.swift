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
  case noTimingEntriesFound
}

private let kSampleBufferError_NoError: OSStatus = 0

extension CMSampleBuffer {
  private func getTimingInfos() throws -> [CMSampleTimingInfo] {
    var count: CMItemCount = 0
    let getCountStatus = CMSampleBufferGetSampleTimingInfoArray(self,
                                                                entryCount: 0,
                                                                arrayToFill: nil,
                                                                entriesNeededOut: &count)
    guard getCountStatus == kSampleBufferError_NoError else {
      throw TimestampAdjustmentError.failedToGetTimingInfo(status: getCountStatus)
    }

    let emptyTimingInfo = CMSampleTimingInfo(duration: .invalid,
                                             presentationTimeStamp: .invalid,
                                             decodeTimeStamp: .invalid)
    var infos = [CMSampleTimingInfo](repeating: emptyTimingInfo, count: count)
    let getArrayStatus = CMSampleBufferGetSampleTimingInfoArray(self,
                                                                entryCount: count,
                                                                arrayToFill: &infos,
                                                                entriesNeededOut: nil)
    guard getArrayStatus == kSampleBufferError_NoError else {
      throw TimestampAdjustmentError.failedToGetTimingInfo(status: getArrayStatus)
    }
    guard !infos.isEmpty else {
      throw TimestampAdjustmentError.noTimingEntriesFound
    }
    return infos
  }

  /**
   Returns a copy of the current CMSampleBuffer with the timing info adjusted by the given offset.
   The decode and presentation timestamps will be adjusted by the given offset (+).
   */
  func copyWithTimestampOffset(_ offset: CMTime) throws -> CMSampleBuffer {
    let timingInfos = try getTimingInfos()
    let newTimingInfos = timingInfos.map { timingInfo in
      return CMSampleTimingInfo(duration: timingInfo.duration,
                                presentationTimeStamp: timingInfo.presentationTimeStamp + offset,
                                decodeTimeStamp: timingInfo.decodeTimeStamp + offset)
    }

    var newBuffer: CMSampleBuffer?
    let copyResult = CMSampleBufferCreateCopyWithNewTiming(allocator: nil,
                                                           sampleBuffer: self,
                                                           sampleTimingEntryCount: newTimingInfos.count,
                                                           sampleTimingArray: newTimingInfos,
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
