//
//  AVAssetWriterInput+applyOrientation.swift
//  VisionCamera
//
//  Created by Maxime Blanchard on 17/11/2023.
//  Copyright © 2023 mrousavy. All rights reserved.
//

import AVFoundation

extension AVAssetWriterInput {
  /**
   Apply the transform based on the orientation of the camera
   */
  func applyVideoOrientation(orientation: Orientation, isMirrored: Bool) {
    var transform: CGAffineTransform = .identity
    
    switch orientation {
    case .portrait:
      transform = CGAffineTransform(rotationAngle: .pi/2)
    case .portraitUpsideDown:
      transform = CGAffineTransform(rotationAngle: -.pi/2)
    case .landscapeLeft:
      transform = CGAffineTransform(rotationAngle: .pi)
    case .landscapeRight:
      transform = .identity
    }
    
    self.transform = isMirrored ? transform.rotated(by: .pi) : transform
  }
}
