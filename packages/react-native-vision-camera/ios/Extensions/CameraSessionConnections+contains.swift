///
/// HybridCameraSession.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

extension Array where Element == CameraSessionConnection {
  var containsOutputThatRequiresAudioInput: Bool {
    return self.contains { connection in
      return connection.outputs.contains { outputConfig in
        if let output = outputConfig.output as? any NativeCameraOutput {
          return output.requiresAudioInput
        } else {
          return false
        }
      }
    }
  }

  func contains(input targetInput: AVCaptureInput) -> Bool {
    guard let targetInput = targetInput as? AVCaptureDeviceInput else {
      // We currently only support AVCaptureDeviceInput. I don't even know if there are other subclasses.
      return false
    }

    return self.contains { connection in
      guard let input = connection.input as? any NativeCameraDevice else {
        return false
      }
      return input.device == targetInput.device
    }
  }

  func contains(output targetOutput: AVCaptureOutput) -> Bool {
    return self.contains { connection in
      return connection.outputs.contains { outputConfiguration in
        guard let output = outputConfiguration.output as? any NativeCameraOutput else {
          return false
        }
        return output.output == targetOutput
      }
    }
  }

  func contains(connection targetConnection: AVCaptureConnection) -> Bool {
    if targetConnection.isConnectedToAudioInput {
      // It's a connection to audio - let's check if we have an output that requires audio
      let containsOutput = self.contains { connection in
        return connection.outputs.contains { outputConfiguration in
          guard let output = outputConfiguration.output as? any NativeCameraOutput else {
            return false
          }
          return output.requiresAudioInput && output.output == targetConnection.output
        }
      }
      return containsOutput
    }

    // It's a connection to a camera device - compare `input` and `output`:
    return self.contains { connection in
      guard let input = connection.input as? any NativeCameraDevice else {
        return false
      }

      // 1. Check if this `connection` has the same `input` as the `targetConnection`
      let containsInput = targetConnection.inputPorts.contains { port in
        guard let deviceInput = port.input as? AVCaptureDeviceInput else {
          return false
        }
        return input.device == deviceInput.device
      }
      if !containsInput {
        return false
      }
      // 2. Check if this `connection` has the same `output` as the `targetConnection`
      let containsOutput = connection.outputs.contains { outputConfiguration in
        switch outputConfiguration.output {
        case let output as any NativeCameraOutput:
          // 2.1. It's an `AVCaptureOutput`
          return targetConnection.output == output.output
        case let previewOutput as any NativePreviewViewOutput:
          // 2.2. It's a Preview output - compare `AVCaptureVideoPreviewLayer`
          return targetConnection.videoPreviewLayer == previewOutput.previewLayer
        default:
          // unknown type!
          return false
        }
      }
      if !containsOutput {
        return false
      }

      // 3. All tests passed!
      return true
    }
  }
}
