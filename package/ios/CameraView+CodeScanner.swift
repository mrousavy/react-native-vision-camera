//
//  CameraView+CodeScanner.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 03.10.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension CameraView: AVCaptureMetadataOutputObjectsDelegate {
  public func metadataOutput(_: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from _: AVCaptureConnection) {
    guard let onCodeScanned = onCodeScanned else {
      return
    }

    // Map codes to JS values
    let codes = metadataObjects.map { object in
      var value: String?
      if let code = object as? AVMetadataMachineReadableCodeObject {
        value = code.stringValue
      }

      return [
        "type": object.type.descriptor,
        "value": value as Any,
        "frame": [
          "x": object.bounds.origin.x,
          "y": object.bounds.origin.y,
          "width": object.bounds.size.width,
          "height": object.bounds.size.height,
        ],
      ]
    }
    // Call JS event
    onCodeScanned([
      "codes": codes,
    ])
  }
}
