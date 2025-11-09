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
    if let hybridOutput = output as? NativeCameraOutput {
      // a) It's a normal AVCaptureSessionOutput - connect it to all it's desired ports
      let mediaType = output.mediaType.toAVMediaType()
      let ports = input.ports(for: mediaType, sourceDeviceType: nil, sourceDevicePosition: .unspecified)
      guard !ports.isEmpty else {
        throw RuntimeError.error(withMessage: "Connection input \"\(input)\" does not have any ports with the requested media type \"\(output.mediaType.stringValue)\"!")
      }
      self.init(inputPorts: ports, output: hybridOutput.output)
    } else if let hybridPreview = output as? NativePreviewViewOutput {
      // b) It's a preview AVCapturePreviewLayer
      let videoPort = input.ports.first { $0.mediaType == .video }
      guard let videoPort else {
        throw RuntimeError.error(withMessage: "Connection input \"\(input)\" does not have a video port!")
      }
      self.init(inputPort: videoPort, videoPreviewLayer: hybridPreview.previewLayer)
    } else {
      // c) It's a bird? It's a plane? no idea
      throw RuntimeError.error(withMessage: "Connection output \"\(output)\" is not of type `NativeCameraOutput` or `NativePreviewViewOutput`!")
    }
  }
}
