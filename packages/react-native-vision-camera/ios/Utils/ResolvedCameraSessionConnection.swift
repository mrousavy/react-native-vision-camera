//
//  ResolvedCameraSessionConnection.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 07.01.26.
//

import AVFoundation
import NitroModules

/**
 * Represents a resolved `CameraSessionConnection`.
 */
struct ResolvedCameraSessionConnection {
  let input: any HybridCameraDeviceSpec & NativeCameraDevice
  let outputs: [OutputConfiguration]
  let initialExposureBias: Double?
  let initialZoom: Double?
  let onSessionConfigSelected: ((_ config: (any HybridCameraSessionConfigSpec)) -> Void)?
  
  init(connection: CameraSessionConnection) throws {
    self.input = try Self.resolveInput(connection.input)
    self.outputs = try connection.outputs.map { try Self.resolveOutput($0) }
    self.initialExposureBias = connection.initialExposureBias
    self.initialZoom = connection.initialZoom
    self.onSessionConfigSelected = connection.onSessionConfigSelected
  }
  
  struct OutputConfiguration {
    let output: Output
    let mirrorMode: MirrorMode
  }
  enum Output {
    case output(any HybridCameraOutputSpec & NativeCameraOutput)
    case preview(any HybridCameraOutputSpec & NativePreviewViewOutput)
  }
  
  private static func resolveInput(_ input: CameraDeviceOrPosition) throws -> any HybridCameraDeviceSpec & NativeCameraDevice {
    switch input {
    case .first(let hybridCameraDeviceSpec):
      guard let input = hybridCameraDeviceSpec as? any HybridCameraDeviceSpec & NativeCameraDevice else {
        throw RuntimeError("The given CameraDevice \"\(hybridCameraDeviceSpec)\" does not conform to `NativeCameraDevice`!")
      }
      return input
    case .second(let targetCameraPosition):
      guard let device = AVCaptureDevice.default(for: targetCameraPosition) else {
        throw RuntimeError("No CameraDevice exists at position \"\(targetCameraPosition)\"!")
      }
      return HybridCameraDevice(device: device)
    }
  }
  private static func resolveOutput(_ outputConfiguration: CameraOutputConfiguration) throws -> OutputConfiguration {
    switch outputConfiguration.output {
    case let hybridOutput as any HybridCameraOutputSpec & NativeCameraOutput:
      // It's a normal AVCaptureOutput
      return OutputConfiguration(output: .output(hybridOutput),
                                 mirrorMode: outputConfiguration.mirrorMode)
    case let hybridPreview as any HybridCameraOutputSpec & NativePreviewViewOutput:
      return OutputConfiguration(output: .preview(hybridPreview),
                                 mirrorMode: outputConfiguration.mirrorMode)
    default:
      throw RuntimeError("Output \"\(outputConfiguration.output)\" is not of type `NativeCameraOutput` or `NativePreviewViewOutput`!")
    }
  }
}
