//
//  DepthFrameDelegate.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.11.25.
//

import Foundation
import AVFoundation

class DepthFrameDelegate: NSObject, AVCaptureDepthDataOutputDelegate {
  var onFrame: ((AVDepthData, CMTime, Orientation) -> Void)?
  var onFrameDropped: ((AVCaptureOutput.DataDroppedReason) -> Void)?

  func depthDataOutput(_ output: AVCaptureDepthDataOutput, didOutput depthData: AVDepthData, timestamp: CMTime, connection: AVCaptureConnection) {
    if let onFrame {
      let orientation = connection.orientation
      onFrame(depthData, timestamp, orientation)
    }
  }
  
  func depthDataOutput(_ output: AVCaptureDepthDataOutput, didDrop depthData: AVDepthData, timestamp: CMTime, connection: AVCaptureConnection, reason: AVCaptureOutput.DataDroppedReason) {
    if let onFrameDropped {
      onFrameDropped(reason)
    }
  }
}
