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
    guard !metadataObjects.isEmpty else {
      return
    }

    // Run this on the main queue, since we access the view's layout from here to convert the coordinates
    DispatchQueue.main.async {
      // Map codes to JS values
      let codes = metadataObjects.map { object in
          var value: String?
          if let code = object as? AVMetadataMachineReadableCodeObject {
              value = code.stringValue
          }

          let frame = self.previewView.layerRectConverted(fromMetadataOutputRect: object.bounds)
          
          return [
              "type": object.type.descriptor,
              "value": value as Any,
              "frame": [
                  "x": frame.origin.x,
                  "y": frame.origin.y,
                  "width": frame.size.width,
                  "height": frame.size.height,
              ],
          ]
      }

      // Call JS event
      onCodeScanned(["codes": codes])
    }
  }
}
