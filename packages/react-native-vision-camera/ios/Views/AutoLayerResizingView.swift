//
//  AutoLayerResizingView.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.11.25.
//

import AVFoundation
import Foundation

/// A view that auto-resizes its sublayers each time
class AutoLayerResizingView: UIView {
  override func layoutSubviews() {
    super.layoutSubviews()
    layer.sublayers?.forEach { layer in
      layer.frame = self.bounds
    }
  }
}
