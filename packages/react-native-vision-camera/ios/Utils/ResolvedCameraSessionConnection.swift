//
//  ResolvedCameraSessionConnection.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 07.01.26.
//

import AVFoundation
import NitroModules

struct ResolvedCameraSessionConnection {
  let input: Input
  let outputs: [Output]
  let constraints: [Constraint]
  let initialZoom: Double?
  let initialExposureBias: Double?
  let onSessionConfigSelected: ((_ config: any HybridCameraSessionConfigSpec) -> Void)?
  
  func isConnectedTo(input: AVCaptureInput) -> Bool {
    guard let input = input as? AVCaptureDeviceInput else {
      return false
    }
    return self.input.device == input.device
  }
  
  func isConnectedTo(output: AVCaptureOutput) -> Bool {
    return self.outputs.contains {
      switch $0.native {
      case .output(let nativeOutput):
        return nativeOutput.output == output
      case .preview:
        return false
      }
    }
  }
  func isConnectedTo(preview: AVCaptureVideoPreviewLayer) -> Bool {
    return self.outputs.contains {
      switch $0.native {
      case .output(let nativeOutput):
        return false
      case .preview(let previewLayer):
        return previewLayer.previewLayer == preview
      }
    }
  }
  
  func contains(connection: AVCaptureConnection) -> Bool {
    guard let deviceInput = connection.deviceInput else {
      // This connection does not have an AVCaptureDeviceInput!
      return false
    }
    guard deviceInput.device == self.input.device else {
      // Not the same input device!
      return false
    }
    
    if let output = connection.output {
      // It's an AVCaptureConnection to an AVCaptureOutput
      guard self.isConnectedTo(output: output) else {
        // Not the same output!
        return false
      }
    } else if let previewLayer = connection.videoPreviewLayer {
      // It's an AVCaptureConnection to an AVCaptureVideoPreviewLayer
      guard self.isConnectedTo(preview: previewLayer) else {
        // Not the same output (preview)!
        return false
      }
    } else {
      // It's a connection without an output..?
      fatalError("AVCaptureConnection doesn't have neither an AVCaptureOutput nor an AVCaptureVideoPreviewLayer!")
    }
    
    // Everything matched!
    return true
  }

  struct Input {
    let hybrid: any HybridCameraDeviceSpec
    let device: AVCaptureDevice
    
    init(from deviceOrPosition: CameraDeviceOrPosition) throws {
      self.device = try AVCaptureDevice.resolve(value: deviceOrPosition)
      switch deviceOrPosition {
      case .first(let hybridCameraDeviceSpec):
        self.hybrid = hybridCameraDeviceSpec
      case .second:
        self.hybrid = HybridCameraDevice(device: device)
      }
    }
  }

  struct Output {
    let hybrid: any HybridCameraOutputSpec
    let native: Native
    let mirrorMode: MirrorMode
    
    var requiresAudioInput: Bool {
      switch native {
      case .output(let nativeCameraOutput):
        return nativeCameraOutput.requiresAudioInput
      case .preview:
        return false
      }
    }

    enum Native {
      case preview(any NativePreviewViewOutput)
      case output(any NativeCameraOutput)
    }
    
    init(from outputConfiguration: CameraOutputConfiguration) throws {
      self.hybrid = outputConfiguration.output
      self.mirrorMode = outputConfiguration.mirrorMode
      
      switch outputConfiguration.output {
      case let output as any NativeCameraOutput:
        self.native = .output(output)
      case let previewOutput as any NativePreviewViewOutput:
        self.native = .preview(previewOutput)
      default:
        throw RuntimeError("Output \"\(outputConfiguration.output)\" is neither a NativePreviewViewOutput, nor a NativeCameraOutput!")
      }
    }
  }
  
  init(from connection: CameraSessionConnection) throws {
    self.input = try Input(from: connection.input)
    self.outputs = try connection.outputs.map { try Output(from: $0) }
    self.constraints = connection.constraints
    self.initialZoom = connection.initialZoom
    self.initialExposureBias = connection.initialExposureBias
    self.onSessionConfigSelected = connection.onSessionConfigSelected
  }
}
