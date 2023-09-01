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
  public func setupPreviewView() {
    previewView?.removeFromSuperview()
    previewView = NativePreviewView(frame: frame, session: captureSession)
    addSubview(previewView!)
  }

  func setupFpsGraph() {
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
