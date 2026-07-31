///
/// AVCaptureConnection+init.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension AVCaptureConnection {
  convenience init(input: AVCaptureDeviceInput, output: ResolvedCameraSessionConnection.Output) throws {
    let mediaType = output.mediaType.toAVMediaType()
    let targetPorts = input.ports.filter { $0.mediaType == mediaType }
    guard !targetPorts.isEmpty else {
      throw RuntimeError.error(
        withMessage:
          "Output \"\(output)\" operates on mediaType \"\(output.mediaType.stringValue)\", but Input \"\(input.device.uniqueID)\" does not have any ports for that mediaType!"
      )
    }

    switch output {
    case .output(let output):
      // a) It's a normal AVCaptureSessionOutput - connect it to all its desired ports
      self.init(inputPorts: targetPorts, output: output.output)
    case .preview(let preview):
      // b) It's a preview AVCapturePreviewLayer
      let port = targetPorts.first!
      self.init(inputPort: port, videoPreviewLayer: preview.previewLayer)
    }
  }
}
