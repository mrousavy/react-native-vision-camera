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
  
  func createCameraSession() -> any HybridCameraSessionSpec {
    return HybridCameraSession()
  }
  
  func createPhotoOutput() -> any HybridCameraSessionPhotoOutputSpec {
    return HybridCameraSessionPhotoOutput()
  }
  
  func createFrameOutput(pixelFormat: TargetPixelFormat) -> any HybridCameraSessionFrameOutputSpec {
    return HybridCameraSessionFrameOutput(targetPixelFormat: pixelFormat)
  }

  func createDepthOutput() throws -> (any HybridCameraSessionFrameOutputSpec) {
    return HybridCameraSessionDepthFrameOutput()
  }
}
