//
//  ResolvedCameraSessionConnection.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 07.01.26.
//

import AVFoundation
import NitroModules

/// Represents a resolved `CameraSessionConnection`.
struct ResolvedCameraSessionConnection {
  let input: any HybridCameraDeviceSpec & NativeCameraDevice
  let outputs: [OutputConfiguration]
  let initialExposureBias: Double?
  let initialZoom: Double?
  let onSessionConfigSelected: ((_ config: (any HybridCameraSessionConfigSpec)) -> Void)?
  let constraints: [Constraint]

  init(connection: CameraSessionConnection) throws {
    self.input = try Self.resolveInput(connection.input)
    self.outputs = try connection.outputs.map { try Self.resolveOutput($0) }
    self.initialExposureBias = connection.initialExposureBias
    self.initialZoom = connection.initialZoom
    self.onSessionConfigSelected = connection.onSessionConfigSelected
    self.constraints = connection.constraints
  }

  var requiresAudioInput: Bool {
    return outputs.contains { $0.output.requiresAudioInput }
  }

  func isConnectedTo(input: AVCaptureInput) -> Bool {
    guard let deviceInput = input as? AVCaptureDeviceInput else {
      return false
    }
    return deviceInput.device == self.input.device
  }
  func isConnectedTo(output avOutput: AVCaptureOutput) -> Bool {
    return outputs.contains { outputConfiguration in
      switch outputConfiguration.output {
      case .output(let output):
        return output.output == avOutput
      case .preview:
        return false
      }
    }
  }
  func isConnectedTo(preview previewLayer: AVCaptureVideoPreviewLayer) -> Bool {
    return outputs.contains { outputConfiguration in
      switch outputConfiguration.output {
      case .output:
        return false
      case .preview(let preview):
        return preview.previewLayer == previewLayer
      }
    }
  }
  func contains(connection: AVCaptureConnection) -> Bool {
    guard let input = connection.deviceInput else {
      return false
    }
    if let output = connection.output {
      return isConnectedTo(input: input) && isConnectedTo(output: output)
    } else if let preview = connection.videoPreviewLayer {
      return isConnectedTo(input: input) && isConnectedTo(preview: preview)
    } else {
      fatalError("AVCaptureConnection does not have .output or .videoPreviewLayer!")
    }
  }

  struct OutputConfiguration {
    let output: Output
    let mirrorMode: MirrorMode
  }
  enum Output {
    case output(any HybridCameraOutputSpec & NativeCameraOutput)
    case preview(any HybridCameraOutputSpec & NativePreviewViewOutput)

    var requiresAudioInput: Bool {
      switch self {
      case .output(let output):
        return output.requiresAudioInput
      case .preview:
        return false
      }
    }

    var mediaType: MediaType {
      switch self {
      case .output(let output):
        return output.mediaType
      case .preview(let preview):
        return preview.mediaType
      }
    }

    var hybrid: any HybridCameraOutputSpec {
      switch self {
      case .output(let output):
        return output
      case .preview(let preview):
        return preview
      }
    }
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
      return OutputConfiguration(
        output: .output(hybridOutput),
        mirrorMode: outputConfiguration.mirrorMode)
    case let hybridPreview as any HybridCameraOutputSpec & NativePreviewViewOutput:
      return OutputConfiguration(
        output: .preview(hybridPreview),
        mirrorMode: outputConfiguration.mirrorMode)
    default:
      throw RuntimeError("Output \"\(outputConfiguration.output)\" is not of type `NativeCameraOutput` or `NativePreviewViewOutput`!")
    }
  }
}
