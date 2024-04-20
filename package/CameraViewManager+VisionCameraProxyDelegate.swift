//
//  CameraViewManager+VisionCameraProxyDelegate.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 20.04.24.
//

import Foundation

#if VISION_CAMERA_ENABLE_FRAME_PROCESSORS

extension CameraViewManager: VisionCameraProxyDelegate {
  func getDispatchQueue() -> dispatch_queue_t {
    return CameraQueues.videoQueue
  }
  
  func getBridge() -> RCTBridge {
    return bridge
  }
  
  func setFrameProcessor(_ frameProcessor: FrameProcessor, forView viewTag: NSNumber) {
    DispatchQueue.main.async {
      let view = self.getCameraView(withTag: viewTag)
      view.frameProcessor = frameProcessor
    }
  }
  
  func removeFrameProcessor(forView viewTag: NSNumber) {
    DispatchQueue.main.async {
      let view = self.getCameraView(withTag: viewTag)
      view.frameProcessor = nil
    }
  }
}

#endif
