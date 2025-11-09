///
/// HybridCameraFactory.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridCameraFactory: HybridCameraFactorySpec {
  var supportsMultiCamSessions: Bool {
    return AVCaptureMultiCamSession.isMultiCamSupported
  }
  
  func createDeviceFactory() -> Promise<any HybridCameraDeviceFactorySpec> {
    return Promise.async {
      return HybridCameraDeviceFactory()
    }
  }

  func createCameraSession(enableMultiCam: Bool) -> any HybridCameraSessionSpec {
    return HybridCameraSession(enableMultiCam: enableMultiCam)
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
