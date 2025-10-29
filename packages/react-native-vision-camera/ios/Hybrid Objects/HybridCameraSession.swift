///
/// HybridCameraSession.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraSession: HybridCameraSessionSpec {
  private let session: AVCaptureSession
  
  override init() {
    self.session = AVCaptureSession()
    super.init()
  }
  
  var isRunning: Bool {
    return session.isRunning
  }
  
  func configureOutputs(outputs: any HybridCameraSessionOutputSpec) throws -> Promise<Void> {
    return Promise.parallel(CameraQueues.cameraQueue) {
      // TODO: Configure them outputs boy
    }
  }
}
