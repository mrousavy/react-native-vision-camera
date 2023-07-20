//
//  CameraView+Preview.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 20.07.23.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation
import Foundation

extension CameraView {
  #if VISION_CAMERA_ENABLE_SKIA
    @objc
    func getSkiaRenderer() -> SkiaRenderer {
      if skiaRenderer == nil {
        skiaRenderer = SkiaRenderer()
      }
      return skiaRenderer!
    }
  #endif

  public func setupPreviewView() {
    if previewType == "skia" {
      // Skia Preview View allows user to draw onto a Frame in a Frame Processor
      #if VISION_CAMERA_ENABLE_SKIA
        if previewView is SkiaPreviewView { return }
        previewView?.removeFromSuperview()
        previewView = SkiaPreviewView(frame: frame, skiaRenderer: getSkiaRenderer())
      #else
        invokeOnError(.system(.skiaUnavailable))
        return
      #endif
    } else {
      // Normal iOS PreviewView is lighter and more performant (YUV Format, GPU only)
      if previewView is NativePreviewView { return }
      previewView?.removeFromSuperview()
      previewView = NativePreviewView(frame: frame, session: captureSession)
    }

    addSubview(previewView!)
  }

  internal func setupFpsGraph() {
    #if DEBUG
      if enableFpsGraph {
        if fpsGraph != nil { return }
        fpsGraph = RCTFPSGraph(frame: CGRect(x: 10, y: 54, width: 75, height: 45), color: .red)
        fpsGraph!.layer.zPosition = 9999.0
        addSubview(fpsGraph!)
      } else {
        fpsGraph?.removeFromSuperview()
        fpsGraph = nil
      }
    #endif
  }
}
