//
//  CameraView+Zoom.swift
//  mrousavy
//
//  Created by Marc Rousavy on 18.12.20.
//  Copyright © 2020 mrousavy. All rights reserved.
//

import Foundation
import UIKit

extension CameraView {
  @objc
  final func onPinch(_ gesture: UIPinchGestureRecognizer) {
    let scale = max(min(gesture.scale * pinchScaleOffset, cameraSession.maxZoom), CGFloat(1.0))
    if gesture.state == .ended {
      pinchScaleOffset = scale
      return
    }

    // Update zoom React prop
    zoom = NSNumber(value: scale)
    didSetProps([])
  }

  func addPinchGestureRecognizer() {
    removePinchGestureRecognizer()
    pinchGestureRecognizer = UIPinchGestureRecognizer(target: self, action: #selector(onPinch(_:)))
    addGestureRecognizer(pinchGestureRecognizer!)
  }

  func removePinchGestureRecognizer() {
    if let pinchGestureRecognizer = pinchGestureRecognizer {
      removeGestureRecognizer(pinchGestureRecognizer)
      self.pinchGestureRecognizer = nil
    }
  }
}
