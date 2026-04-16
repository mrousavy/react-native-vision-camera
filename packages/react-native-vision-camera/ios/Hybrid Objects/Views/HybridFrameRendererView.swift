///
/// HybridFrameRendererView.swift
/// VisionCamera
/// Copyright © 2025 Marc Rousavy @ Margelo
///

import AVFoundation
import Foundation
import NitroModules

class HybridFrameRendererView: HybridFrameRendererViewSpec {
  var view: UIView = AutoLayerResizingView()
  var renderer: (any HybridFrameRendererSpec)? {
    didSet {
      updateRendererLayer()
    }
  }

  private func updateRendererLayer() {
    DispatchQueue.main.async {
      self.view.layer.sublayers?.removeAll()
      if let renderer = self.renderer as? any NativeFrameRenderer {
        self.view.layer.addSublayer(renderer.layer)
        renderer.layer.frame = self.view.bounds
      }
    }
  }
}
