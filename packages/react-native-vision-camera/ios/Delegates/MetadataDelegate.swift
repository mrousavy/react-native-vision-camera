//
//  MetadataDelegate.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.11.25.
//

import AVFoundation
import Foundation

final class MetadataDelegate: NSObject, AVCaptureMetadataOutputObjectsDelegate {
  var onMetadataObjects: (([AVMetadataObject]) -> Void)?

  func metadataOutput(
    _ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject],
    from connection: AVCaptureConnection
  ) {
    if let onMetadataObjects {
      onMetadataObjects(metadataObjects)
    }
  }
}
