///
/// HybridCameraFactory.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraFactory: HybridCameraFactorySpec {
  func createDeviceFactory() -> Promise<any HybridCameraDeviceFactorySpec> {
    return Promise.parallel(CameraQueues.cameraQueue) {
      return HybridCameraDeviceFactory()
    }
  }
  
  func createCameraSession() -> any HybridCameraSessionSpec {
    return HybridCameraSession()
  }
  
  func createPhotoOutput() -> any HybridCameraSessionPhotoOutputSpec {
    return HybridCameraSessionPhotoOutput()
  }
}
