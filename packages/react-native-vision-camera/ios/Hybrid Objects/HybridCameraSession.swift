///
/// HybridCameraSession.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraSession: HybridCameraSessionSpec {
  let session: AVCaptureSession
  private let queue: DispatchQueue

  init(enableMultiCam: Bool) {
    if enableMultiCam {
      self.session = AVCaptureMultiCamSession()
    } else {
      self.session = AVCaptureSession()
    }
    self.queue = DispatchQueue(label: "com.margelo.camera.session-\(self.session)",
                               qos: .userInteractive,
                               attributes: [],
                               autoreleaseFrequency: .inherit,
                               target: nil)
    super.init()
  }

  var cameraThread: any HybridNativeThreadSpec {
    return HybridNativeThread(queue: queue)
  }
  var isRunning: Bool {
    return session.isRunning
  }
  var supportsMultiCam: Bool {
    return session is AVCaptureMultiCamSession
  }

  func configure(connections: [CameraSessionConnection]) -> Promise<[any HybridCameraDeviceControllerSpec]> {
    return Promise.parallel(queue) {
      // Wrap the configuration in a batch
      self.session.beginConfiguration()
      defer { self.session.commitConfiguration() }
      
      // Remove all connections/inputs/outputs that we don't need
      self.removeAllUnwantedConnections(targetConnections: connections)
      
      // Ensure multi-cam is enabled if we have multiple inputs
      if connections.count > 1 {
        guard self.supportsMultiCam else {
          throw RuntimeError.error(withMessage: "Cannot add multiple inputs (\(connections)) to a single-cam CameraSession! " + "Create your CameraSession as a multi-cam session (`enableMultiCamSupport = true`) to add multiple camera inputs.")
        }
      }

      // Connect inputs and outputs
      for connection in connections {
        // 2. Maybe add input
        guard let input = connection.input as? HybridCameraDevice else {
          throw RuntimeError.error(withMessage: "Input \"\(connection.input)\" does not conform to `HybridCameraDevice`!")
        }
        let deviceInput = try self.session.input(forDevice: input.device)
        if !self.session.inputs.contains(deviceInput) {
          guard self.session.canAddInput(deviceInput) else {
            throw RuntimeError.error(withMessage: "Input (\(deviceInput)) cannot be added to CameraSession!")
          }
          print("Adding Input \"\(deviceInput)\"...")
          self.session.addInputWithNoConnections(deviceInput)
        }

        // 3. Loop through all outputs of this connection
        for output in connection.outputs {
          // 3.1. Maybe add output (preview is not a real output so that's the exception)
          if !self.session.containsOutput(output) {
            try self.session.addOutputWithNoConnections(output)
          }

          // 3.3. Create connection
          if !self.session.containsConnection(deviceInput: deviceInput, output: output) {
            try self.session.addConnection(deviceInput: deviceInput, output: output)
          }
        }
      }
      
      // 4. Return CameraDeviceControllers per connection to adjust camera settings (focus, etc)
      return try connections.map { connection in
        return try HybridCameraDeviceController(device: connection.input, queue: self.queue)
      }
    }
  }

  func start() -> Promise<Void> {
    return Promise.parallel(queue) {
      self.session.startRunning()
    }
  }

  func stop() -> Promise<Void> {
    return Promise.parallel(queue) {
      self.session.stopRunning()
    }
  }
  
  private func removeAllUnwantedConnections(targetConnections: [CameraSessionConnection]) {
    // Flat map all inputs & outputs
    let allInputs = targetConnections
      .compactMap { $0.input as? HybridCameraDevice }
      .withoutDuplicates { left, right in left === right }
    let flatOutputs = targetConnections
      .flatMap { $0.outputs }
      .withoutDuplicates { left, right in left === right }
    let allOutputs = flatOutputs.compactMap { $0 as? NativeCameraOutput }
    let allPreviews = flatOutputs.compactMap { $0 as? NativePreviewViewOutput }
    
    let connectionsCountBefore = self.session.connections.count
    
    // Remove any old inputs that we don't need anymore
    for input in self.session.inputs {
      guard let deviceInput = input as? AVCaptureDeviceInput else {
        continue
      }
      let containsInput = allInputs.contains { $0.device == deviceInput.device }
      if !containsInput {
        print("Removing Input \(input)...")
        self.session.removeInput(input)
      }
    }
    // Remove any old outputs that we don't need anymore
    for output in self.session.outputs {
      let containsOutput = allOutputs.contains { $0.output == output }
      if !containsOutput {
        print("Removing Output \(output)...")
        self.session.removeOutput(output)
      }
    }
    // Remove any old preview connections that we don't need anymore
    for connection in self.session.connections {
      if let previewLayer = connection.videoPreviewLayer {
        let containsPreviewLayer = allPreviews.contains { $0.previewLayer == previewLayer }
        if !containsPreviewLayer {
          print("Removing Preview \(previewLayer)")
          self.session.removeConnection(connection)
          previewLayer.session = nil
        }
      }
    }
    
    let connectionsCountAfter = self.session.connections.count
    print("Removed \(connectionsCountBefore - connectionsCountAfter) Connection(s)!")
  }
}
