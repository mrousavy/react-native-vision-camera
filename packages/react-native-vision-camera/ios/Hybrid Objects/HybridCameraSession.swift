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
      
      // TODO: Remove only inputs/outputs/connections that we don't use
      self.session.connections.forEach {
        print("Removing Connection \($0)")
        self.session.removeConnection($0)
      }
      self.session.inputs.forEach {
        print("Removing Input \($0)")
        self.session.removeInput($0)
      }
      self.session.outputs.forEach {
        print("Removing Output \($0)")
        self.session.removeOutput($0)
      }
      
      let allInputs = connections.map { $0.input }.withoutDuplicates { left, right in left === right }
      // Ensure multi-cam is enabled if we have multiple inputs
      if allInputs.count > 1 {
        guard self.supportsMultiCam else {
          throw RuntimeError.error(withMessage: "Cannot add multiple inputs (\(allInputs)) to a single-cam CameraSession! " + "Create your CameraSession as a multi-cam session (`enableMultiCamSupport = true`) to add multiple camera inputs.")
        }
      }

      // Connect inputs and outputs
      for connection in connections {
        // 2. Maybe add input
        guard let input = connection.input as? HybridCameraDevice else {
          throw RuntimeError.error(withMessage: "Input \"\(connection.input)\" does not conform to `HybridCameraDevice`!")
        }
        let deviceInput = try AVCaptureDeviceInput(device: input.device)
        if !self.session.inputs.contains(deviceInput) {
          guard self.session.canAddInput(deviceInput) else {
            throw RuntimeError.error(withMessage: "Input (\(deviceInput)) cannot be added to CameraSession!")
          }
          print("Adding Input \"\(input)\"...")
          self.session.addInputWithNoConnections(deviceInput)
        }

        // 3. Loop through all outputs of this connection
        for output in connection.outputs {
          // 3.1. Maybe add output (preview is not a real output so that's the exception)
          if !self.session.containsOutput(output) {
            print("Adding Output \"\(output)\"...")
            try self.session.addOutputWithNoConnections(output)
          }

          // 3.3. Create connection
          let connection = try AVCaptureConnection(input: deviceInput, output: output)
          guard self.session.canAddConnection(connection) else {
            throw RuntimeError.error(withMessage: "Connection \"\(connection)\" cannot be added to Camera Session!")
          }
          print("Adding Connection \"\(connection)\"...")
          self.session.addConnection(connection)
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
}
