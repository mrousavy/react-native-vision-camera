//
//  FrameToCameraMatrix.swift
//  VisionCamera
//
//  Created by Marc Rousavy on 29.01.26.
//

import AVFoundation
import CoreGraphics

enum FrameCoordinateSystemConverter {
  /**
   * Get a Matrix that can convert a point in the
   * given `pixelBuffer` to normalized Camera coordiantes.
   * The `orientation` and `isMirrored` flags affect the
   * Matrix if the `Frame` needs those to be adjusted.
   */
  static func getFrameToCameraMatrix(
    pixelBuffer: CVPixelBuffer,
    orientation: Orientation,
    isMirrored: Bool
  ) -> CGAffineTransform {
    let width = CGFloat(CVPixelBufferGetWidth(pixelBuffer))
    let height = CGFloat(CVPixelBufferGetHeight(pixelBuffer))

    // Normalized 0...width/0...height -> 0...1/0...1
    var matrix = CGAffineTransform.identity
      .scaledBy(x: 1.0 / width, y: 1.0 / height)

    // Orientation is applied in normalized space around origin.
    // We add translations so the transformed result stays in [0,1]x[0,1].
    switch orientation {
    case .up:
      // (x, y)
      break
    case .down:
      // (1-x, 1-y)
      matrix =
        matrix
        .translatedBy(x: 1, y: 1)
        .rotated(by: .pi)
    case .left:
      // portrait: (y, 1-x)
      matrix =
        matrix
        .translatedBy(x: 1, y: 0)
        .rotated(by: .pi / 2)
    case .right:
      // portraitUpsideDown: (1-y, x)
      matrix =
        matrix
        .translatedBy(x: 0, y: 1)
        .rotated(by: -.pi / 2)
    }

    if isMirrored {
      // Mirror in normalized space: x -> 1-x
      matrix =
        matrix
        .translatedBy(x: 1, y: 0)
        .scaledBy(x: -1, y: 1)
    }

    return matrix
  }

  static func getCameraToFrameMatrix(
    pixelBuffer: CVPixelBuffer,
    orientation: Orientation,
    isMirrored: Bool
  ) -> CGAffineTransform {
    let frameToCameraMatrix = getFrameToCameraMatrix(
      pixelBuffer: pixelBuffer,
      orientation: orientation,
      isMirrored: isMirrored)
    return frameToCameraMatrix.inverted()
  }
}
