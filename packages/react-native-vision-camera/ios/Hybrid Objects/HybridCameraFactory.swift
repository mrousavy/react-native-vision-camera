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
    return Promise.async {
      return HybridCameraDeviceFactory()
    }
  }
  
  func createCameraSession(sessionType: CameraSessionType) -> any HybridCameraSessionSpec {
    return HybridCameraSession(sessionType: sessionType)
  }
  
  func createPhotoOutput() -> any HybridCameraSessionPhotoOutputSpec {
    return HybridCameraSessionPhotoOutput()
  }
  
  func createFrameOutput(pixelFormat: TargetPixelFormat) -> any HybridCameraSessionFrameOutputSpec {
    return HybridCameraSessionFrameOutput(targetPixelFormat: pixelFormat)
  }
  
  func createPreviewOutput() -> any HybridCameraSessionPreviewOutputSpec {
    return HybridCameraSessionPreviewOutput()
  }
}
