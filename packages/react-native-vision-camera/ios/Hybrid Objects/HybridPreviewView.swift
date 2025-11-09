///
/// HybridPreviewView.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import Foundation
import NitroModules
import AVFoundation

class HybridPreviewView: HybridPreviewViewSpec {
  var view: UIView = AutoLayerResizingView()
  var previewOutput: (any HybridCameraSessionPreviewOutputSpec)? {
    didSet {
      updatePreviewLayer()
    }
  }
  
  private func updatePreviewLayer() {
    DispatchQueue.main.async {
      self.view.layer.sublayers?.removeAll()
      if let previewOutput = self.previewOutput as? HybridCameraSessionPreviewOutput {
        self.view.layer.addSublayer(previewOutput.previewLayer)
        previewOutput.previewLayer.frame = self.view.bounds
      }
    }
  }
}
