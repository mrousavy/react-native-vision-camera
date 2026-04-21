//
//  SynchronizedOutputDelegate.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.11.25.
//

import AVFoundation
import Foundation
import NitroModules

enum SynchroizedData {
  case video(CMSampleBuffer)
  case depth(AVDepthData)
}
struct SynchronizedDataFrame {
  let data: SynchroizedData
  let metadata: MediaSampleMetadata
}

final class SynchronizedOutputDelegate: NSObject, AVCaptureDataOutputSynchronizerDelegate {
  var onFrames: (([SynchronizedDataFrame]) -> Void)?
  var onFrameDropped: ((MediaType, AVCaptureOutput.DataDroppedReason) -> Void)?

  func dataOutputSynchronizer(
    _ synchronizer: AVCaptureDataOutputSynchronizer,
    didOutput synchronizedDataCollection: AVCaptureSynchronizedDataCollection
  ) {
    guard let onFrames else { return }

    // Use autoreleasepool to avoid memory buildup when processing synchronized frames
    autoreleasepool {
      var datas: [SynchronizedDataFrame] = []
      for output in synchronizer.dataOutputs {
        guard let data = synchronizedDataCollection.synchronizedData(for: output) else {
          logger.warning("AVCaptureSynchronizedDataCollection does not contain data for \(output)!")
          continue
        }
        do {
          switch data {
          case let video as AVCaptureSynchronizedSampleBufferData:
            // Video Frame
            guard !video.sampleBufferWasDropped else {
              onFrameDropped?(.video, video.droppedReason)
              continue
            }
            let frame = try getSynchronizedVideoFrame(from: synchronizer, data: video)
            datas.append(frame)
          case let depth as AVCaptureSynchronizedDepthData:
            // Depth Frame
            guard !depth.depthDataWasDropped else {
              onFrameDropped?(.depth, depth.droppedReason)
              continue
            }
            let frame = try getSynchronizedDepthFrame(from: synchronizer, data: depth)
            datas.append(frame)
          default:
            // ????? Frame
            logger.error("SynchronizedOutputDelegate received an unknown data type! \(data)")
          }
        } catch (let error) {
          logger.error("Failed to capture AVCaptureSynchronizedData \(data)! Error: \(error)")
          onFrameDropped?(.other, .none)
        }
      }
      onFrames(datas)
    }
  }

  private func getConnectedOutput<T: AVCaptureOutput>(
    from synchronizer: AVCaptureDataOutputSynchronizer
  ) throws -> T {
    for output in synchronizer.dataOutputs {
      if let specific = output as? T {
        return specific
      }
    }
    throw RuntimeError.error(
      withMessage:
        "AVCaptureDataOutputSynchronizer does not contain an output of type \(String(describing: T.self))!"
    )
  }
  private func getConnection<T: AVCaptureOutput>(from output: T, ofType type: AVMediaType) throws
    -> AVCaptureConnection
  {
    guard let connection = output.connection(with: type) else {
      throw RuntimeError.error(withMessage: "\(T.self) does not have a \(type) connection!")
    }
    return connection
  }

  private func getSynchronizedVideoFrame(
    from synchronizer: AVCaptureDataOutputSynchronizer, data: AVCaptureSynchronizedSampleBufferData
  ) throws -> SynchronizedDataFrame {
    let videoOutput: AVCaptureVideoDataOutput = try getConnectedOutput(from: synchronizer)
    let connection = try getConnection(from: videoOutput, ofType: .video)
    let buffer = data.sampleBuffer
    let metadata = MediaSampleMetadata(
      timestamp: data.timestamp, orientationFromConnection: connection)
    return SynchronizedDataFrame(data: .video(buffer), metadata: metadata)
  }

  private func getSynchronizedDepthFrame(
    from synchronizer: AVCaptureDataOutputSynchronizer, data: AVCaptureSynchronizedDepthData
  ) throws -> SynchronizedDataFrame {
    let depthOutput: AVCaptureDepthDataOutput = try getConnectedOutput(from: synchronizer)
    let connection = try getConnection(from: depthOutput, ofType: .depthData)
    let buffer = data.depthData
    let metadata = MediaSampleMetadata(
      timestamp: data.timestamp, orientationFromConnection: connection)
    return SynchronizedDataFrame(data: .depth(buffer), metadata: metadata)
  }
}
