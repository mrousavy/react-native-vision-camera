///
/// AVCaptureConnection+init.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

extension AVCaptureConnection {
  convenience init(input: AVCaptureDeviceInput, output: any HybridCameraOutputSpec) throws {
    let mediaType = output.mediaType.toAVMediaType()
    let targetPorts = input.ports.filter { $0.mediaType == mediaType }
    guard !targetPorts.isEmpty else {
      throw RuntimeError.error(withMessage: "Output \"\(output)\" operates on mediaType \"\(output.mediaType.stringValue)\", but Input \"\(input.device.uniqueID)\" does not have any ports for that mediaType!")
    }
    
    if let hybridOutput = output as? NativeCameraOutput {
      // a) It's a normal AVCaptureSessionOutput - connect it to all it's desired ports
      self.init(inputPorts: targetPorts, output: hybridOutput.output)
    } else if let hybridPreview = output as? NativePreviewViewOutput {
      // b) It's a preview AVCapturePreviewLayer
      let port = targetPorts.first!
      self.init(inputPort: port, videoPreviewLayer: hybridPreview.previewLayer)
    } else {
      // c) It's a bird? It's a plane? no idea
      throw RuntimeError.error(withMessage: "Connection output \"\(output)\" is not of type `NativeCameraOutput` or `NativePreviewViewOutput`!")
    }
  }
}
