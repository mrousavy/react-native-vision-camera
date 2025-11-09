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
  private static var counter = 0

  override init() {
    self.session = AVCaptureSession()
    Self.counter += 1
    let instanceId = Self.counter
    self.queue = DispatchQueue(label: "com.margelo.camera.session-\(instanceId)",
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

  func configure(connections: [CameraSessionConnection]) -> Promise<[any HybridCameraDeviceControllerSpec]> {
    return Promise.parallel(queue) {
      // Wrap the configuration in a batch
      self.session.beginConfiguration()
      defer { self.session.commitConfiguration() }
      
      // TODO: Remove only inputs/outputs/connections that we don't use
      self.session.connections.forEach { self.session.removeConnection($0) }
      self.session.inputs.forEach { self.session.removeInput($0) }
      self.session.outputs.forEach { self.session.removeOutput($0) }

      // Connect inputs and outputs
      for connection in connections {
        // 2. Maybe add input
        let input = connection.input
        if !self.session.containsInput(input) {
          try self.session.addInputWithNoConnections(input)
        }

        // 3. Loop through all outputs of this connection
        for output in connection.outputs {
          // 3.1. Maybe add output (preview is not a real output so that's the exception)
          if !self.session.containsOutput(output) {
            try self.session.addOutputWithNoConnections(output)
          }

          // 3.3. Create connection
          let connection = try AVCaptureConnection(input: input, output: output)
          guard self.session.canAddConnection(connection) else {
            throw RuntimeError.error(withMessage: "Connection from \"\(input)\" -> \"\(output)\" cannot be added to Camera Session!")
          }
          self.session.addConnection(connection)
        }
      }
      
      // TODO: Return controller to set focus etc
      return []
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

  private func areInputsTheSame(_ inputs:  [any HybridCameraDeviceSpec]) -> Bool {
    guard session.inputs.count == inputs.count else {
      return false
    }
    return inputs.allSatisfy { input in session.containsInput(input) }
  }
  private func areOutputsTheSame(_ outputs:  [any HybridCameraOutputSpec]) -> Bool {
    guard session.outputs.count == outputs.count else {
      return false
    }
    return outputs.allSatisfy { output in session.containsOutput(output) }
  }
}
