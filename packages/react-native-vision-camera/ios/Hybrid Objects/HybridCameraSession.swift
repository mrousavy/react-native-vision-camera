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
  
  override init() {
    self.session = AVCaptureSession()
    super.init()
  }
  
  var isRunning: Bool {
    return session.isRunning
  }
  
  func configure(inputs: [any HybridCameraDeviceSpec],
                 outputs: [any HybridCameraSessionOutputSpec]) -> Promise<Void> {
    return Promise.parallel(CameraQueues.cameraQueue) {
      // 0. We do everything under a configuration - to keep it batched
      self.session.beginConfiguration()
      defer { self.session.commitConfiguration() }
      
      // 1. Remove all current inputs
      self.session.inputs.forEach { self.session.removeInput($0) }
      
      // 2. Add all inputs again
      for inputSpec in inputs {
        try self.session.addInput(inputSpec)
      }
      
      // 3. Remove all current outputs
      self.session.outputs.forEach { self.session.removeOutput($0) }
      
      // 4. Add all outputs again
      for outputSpec in outputs {
        try self.session.addOutput(outputSpec)
      }
    }
  }
  
  func start() -> Promise<Void> {
    return Promise.parallel(CameraQueues.cameraQueue) {
      self.session.startRunning()
    }
  }
  
  func stop() -> Promise<Void> {
    return Promise.parallel(CameraQueues.cameraQueue) {
      self.session.stopRunning()
    }
  }
}
