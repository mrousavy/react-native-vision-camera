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
  let sessionType: CameraSessionType
  private let queue: DispatchQueue

  init(sessionType: CameraSessionType) {
    switch sessionType {
    case .singleCam:
      self.session = AVCaptureSession()
    case .multiCam:
      self.session = AVCaptureMultiCamSession()
    }
    self.sessionType = sessionType
    self.queue = DispatchQueue(label: "com.margelo.camera.session-\(sessionType.stringValue)",
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
      
      let allInputs = connections.map { $0.input }.withoutDuplicates { left, right in left === right }
      // Ensure multi-cam is enabled if we have multiple inputs
      if allInputs.count > 1 {
        guard self.sessionType == .multiCam else {
          throw RuntimeError.error(withMessage: "Cannot add multiple inputs (\(allInputs)) to a single-cam CameraSession! " + "Create your CameraSession as a \"multi-cam\" to add multiple camera inputs.")
        }
      }

      // Connect inputs and outputs
      for connection in connections {
        // 2. Maybe add input
        let input = connection.input
        if !self.session.containsInput(input) {
          print("Adding Input \"\(input)\"...")
          try self.session.addInputWithNoConnections(input)
        }

        // 3. Loop through all outputs of this connection
        for output in connection.outputs {
          // 3.1. Maybe add output (preview is not a real output so that's the exception)
          if !self.session.containsOutput(output) {
            print("Adding Output \"\(output)\"...")
            try self.session.addOutputWithNoConnections(output)
          }

          // 3.3. Create connection
          let connection = try AVCaptureConnection(input: input, output: output)
          guard self.session.canAddConnection(connection) else {
            throw RuntimeError.error(withMessage: "Connection from \"\(input)\" -> \"\(output)\" cannot be added to Camera Session!")
          }
          print("Adding Connection \"\(connection)\"...")
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
