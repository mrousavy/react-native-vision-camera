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
  private var configuration: CameraSessionConfiguration? = nil
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
  
  func configure(inputs: [any HybridCameraDeviceSpec],
                 outputs: [any HybridCameraSessionOutputSpec],
                 configuration: CameraSessionConfiguration) -> Promise<Void> {
    return Promise.parallel(queue) {
      // 1. Check if we need to do an actual session configuration batch
      let isSessionTheSame = self.areInputsTheSame(inputs) && self.areOutputsTheSame(outputs)
      if !isSessionTheSame {
        // 1.1. Wrap the configuration in a batch
        self.session.beginConfiguration()
        defer { self.session.commitConfiguration() }
        
        // 1.2. Remove all inputs that are not part of our target inputs array
        try self.session.removeOtherInputs(except: inputs)
        // 1.3. Add all inputs from our target array that are not part of the session yet
        try self.session.addNewInputs(from: inputs)
        
        // 1.4. Remove all outputs that are not part of our target outputs array
        try self.session.removeOtherOutputs(except: outputs)
        // 1.5. Add all outputs from our target array that are not part of the session yet
        try self.session.addNewOutputs(from: outputs)
      }
      
      // 2. Check if the configuration itself changed - we need to batch that in device locks
      // TODO: Detect if configuration changed.. somehow.
      let isConfigTheSame = false
      if !isConfigTheSame {
        
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
  
  private func areInputsTheSame(_ inputs:  [any HybridCameraDeviceSpec]) -> Bool {
    guard session.inputs.count == inputs.count else {
      return false
    }
    return inputs.allSatisfy { input in session.containsInput(input) }
  }
  private func areOutputsTheSame(_ outputs:  [any HybridCameraSessionOutputSpec]) -> Bool {
    guard session.outputs.count == outputs.count else {
      return false
    }
    return outputs.allSatisfy { output in session.containsOutput(output) }
  }
}
