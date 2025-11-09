//
//  AutoLayerResizingView.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 05.11.25.
//

import Foundation
import AVFoundation

/**
 * A view that auto-resizes it's sublayers each time
 */
class AutoLayerResizingView: UIView {
  override func layoutSubviews() {
    super.layoutSubviews()
    layer.sublayers?.forEach { layer in
      layer.frame = self.bounds
    }
  }
}
