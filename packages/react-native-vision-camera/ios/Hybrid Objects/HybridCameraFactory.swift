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

  func createCameraSession(enableMultiCam: Bool) throws -> any HybridCameraSessionSpec {
    if enableMultiCam {
      guard supportsMultiCamSessions else {
        throw RuntimeError.error(withMessage: "Failed to create CameraSession - this device does not support multi-cam session! (See .supportsMultiCamSession)")
      }
    }
    return HybridCameraSession(enableMultiCam: enableMultiCam)
  }

  func createPhotoOutput() -> any HybridCameraPhotoOutputSpec {
    return HybridCameraPhotoOutput()
  }

  func createFrameOutput(pixelFormat: TargetVideoPixelFormat) -> any HybridCameraFrameOutputSpec {
    return HybridCameraFrameOutput(targetPixelFormat: pixelFormat)
  }
  
  func createDepthFrameOutput(pixelFormat: TargetDepthPixelFormat) throws -> any HybridCameraDepthFrameOutputSpec {
    return HybridCameraDepthFrameOutput(targetPixelFormat: pixelFormat)
  }

  func createPreviewOutput() -> any HybridCameraPreviewOutputSpec {
    return HybridCameraPreviewOutput()
  }
}
