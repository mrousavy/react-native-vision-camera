///
/// AVCaptureConnection+init.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

extension AVCaptureConnection {
  convenience init(input: any HybridCameraDeviceSpec, output: any HybridCameraOutputSpec) throws {
    // 1. Get Input
    guard let hybridInput = input as? HybridCameraDevice else {
      throw RuntimeError.error(withMessage: "Connection input \"\(input)\" is not of type `HybridCameraDevice`!")
    }
    let input = try hybridInput.getInput()
    // 2. Get output (we have two options)
    if let hybridOutput = output as? NativeCameraOutput {
      // 2.1. It's a normal AVCaptureSessionOutput
      self.init(inputPorts: input.ports, output: hybridOutput.output)
    } else if let hybridPreview = output as? NativePreviewViewOutput {
      // 2.2. It's a preview AVCapturePreviewLayer
      let videoPort = input.ports.first { $0.mediaType == .video }
      guard let videoPort else {
        throw RuntimeError.error(withMessage: "Connection input \"\(input)\" does not have a video port!")
      }
      self.init(inputPort: videoPort, videoPreviewLayer: hybridPreview.previewLayer)
    } else {
      // 2.3. It's a bird? It's a plane? no idea
      throw RuntimeError.error(withMessage: "Connection output \"\(output)\" is not of type `NativeCameraOutput` or `NativePreviewViewOutput`!")
    }
  }
}
