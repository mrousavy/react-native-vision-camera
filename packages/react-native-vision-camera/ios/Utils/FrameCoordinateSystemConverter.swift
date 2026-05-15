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
   * Get a Matrix that maps a point in the given `pixelBuffer` to a normalized
   * camera point `(cx, cy) ∈ [0, 1]²`, applying `orientation` and `isMirrored`.
   *
   * Each orientation maps the frame pixel `(x, y)` to:
   * - `.up`    → (    x/w,     y/h)
   * - `.down`  → (1 - x/w, 1 - y/h)
   * - `.left`  → (    y/h, 1 - x/w)
   * - `.right` → (1 - y/h,     x/w)
   *
   * Implemented as a direct affine matrix per orientation rather than chained
   * `.scaledBy().translatedBy().rotated()` calls — those translate in pixel
   * space (the scale is post-pended) so `(1, 0)` shifts by one pixel, not by
   * the full width. Issue #3871.
   */
  static func getFrameToCameraMatrix(
    pixelBuffer: CVPixelBuffer,
    orientation: CameraOrientation,
    isMirrored: Bool
  ) -> CGAffineTransform {
    let w = CGFloat(CVPixelBufferGetWidth(pixelBuffer))
    let h = CGFloat(CVPixelBufferGetHeight(pixelBuffer))

    // CGAffineTransform applies as `cx = a*x + c*y + tx`, `cy = b*x + d*y + ty`.
    var matrix: CGAffineTransform
    switch orientation {
    case .up:
      matrix = CGAffineTransform(a: 1 / w, b: 0, c: 0, d: 1 / h, tx: 0, ty: 0)
    case .down:
      matrix = CGAffineTransform(a: -1 / w, b: 0, c: 0, d: -1 / h, tx: 1, ty: 1)
    case .left:
      matrix = CGAffineTransform(a: 0, b: -1 / w, c: 1 / h, d: 0, tx: 0, ty: 1)
    case .right:
      matrix = CGAffineTransform(a: 0, b: 1 / w, c: -1 / h, d: 0, tx: 1, ty: 0)
    }

    if isMirrored {
      // Mirror in normalized output space: `(cx, cy) → (1 - cx, cy)`. For an
      // affine `[a c tx; b d ty]`, post-composing flips the signs of `a` and
      // `c` and replaces `tx` with `1 - tx`.
      matrix = CGAffineTransform(
        a: -matrix.a, b: matrix.b,
        c: -matrix.c, d: matrix.d,
        tx: 1 - matrix.tx, ty: matrix.ty
      )
    }

    return matrix
  }

  static func getCameraToFrameMatrix(
    pixelBuffer: CVPixelBuffer,
    orientation: CameraOrientation,
    isMirrored: Bool
  ) -> CGAffineTransform {
    let frameToCameraMatrix = getFrameToCameraMatrix(
      pixelBuffer: pixelBuffer,
      orientation: orientation,
      isMirrored: isMirrored)
    return frameToCameraMatrix.inverted()
  }
}
