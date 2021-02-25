//
//  CameraView+CodeScanning.swift
//  Cuvent
//
//  Created by Marc Rousavy on 16.12.20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import AVFoundation
import Foundation

extension CameraView: AVCaptureMetadataOutputObjectsDelegate {
  func metadataOutput(_: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from _: AVCaptureConnection) {
    if metadataObjects.isEmpty {
      return
    }

    let objects = metadataObjects.map { (object) -> [String: Any]? in
      guard let object = object as? AVMetadataMachineReadableCodeObject else {
        return nil
      }
      return [
        "code": object.stringValue as Any,
        "type": object.type.descriptor,
        "bounds": [
          "minX": object.bounds.minX,
          "minY": object.bounds.minY,
          "maxX": object.bounds.maxX,
          "maxY": object.bounds.maxY,
          "width": object.bounds.width,
          "height": object.bounds.height,
        ],
      ]
    }
    invokeOnCodeScanned(codes: objects)
  }

  private func invokeOnCodeScanned(codes: [[String: Any]?]) {
    guard let onCodeScanned = self.onCodeScanned else {
      ReactLogger.log(level: .warning,
                      message: "onCodeScanned was invoked with no listeners. " +
                        "This means that the Camera is unnecessarily scanning codes. This indicates a memory leak.",
                      alsoLogToJS: true)
      return
    }
    onCodeScanned(["codes": codes])
  }
}
