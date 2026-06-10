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
   * Get a Matrix that can convert a point in oriented (display-space)
   * frame coordinates to normalized Camera coordinates (`(cx, cy) ∈ [0, 1]²`).
   *
   * Frame coordinates are in the oriented/visual space as returned by ML
   * analyzers: (0,0) is the top-left of the displayed image regardless of
   * how the raw sensor buffer is rotated. For 90° rotations (left/right)
   * the oriented dimensions are the transpose of the buffer dimensions.
   *
   * Camera coordinates are normalized buffer coordinates - the same space
   * AVFoundation calls "capture device point of interest", which
   * `AVCaptureVideoPreviewLayer.layerPointConverted(fromCaptureDevicePoint:)`
   * and focus/exposure points-of-interest expect.
   */
  static func getFrameToCameraMatrix(
    pixelBuffer: CVPixelBuffer,
    orientation: CameraOrientation,
    isMirrored: Bool
  ) -> CGAffineTransform {
    let bufferWidth = CGFloat(CVPixelBufferGetWidth(pixelBuffer))
    let bufferHeight = CGFloat(CVPixelBufferGetHeight(pixelBuffer))

    // For 90° rotations the oriented frame dimensions are the transpose of
    // the raw buffer dimensions.
    let orientedWidth: CGFloat
    let orientedHeight: CGFloat
    switch orientation {
    case .left, .right:
      orientedWidth = bufferHeight
      orientedHeight = bufferWidth
    case .up, .down:
      orientedWidth = bufferWidth
      orientedHeight = bufferHeight
    }

    // 1. Normalize oriented pixels to [0, 1]
    var matrix = CGAffineTransform(scaleX: 1.0 / orientedWidth, y: 1.0 / orientedHeight)

    // 2. Un-mirror. Display mirroring flips the upright image, so this
    //    happens in oriented space, before un-rotating into buffer space.
    if isMirrored {
      let mirror = CGAffineTransform.identity
        .translatedBy(x: 1, y: 0)
        .scaledBy(x: -1, y: 1)
      matrix = matrix.concatenating(mirror)
    }

    // 3. Rotate the normalized oriented point back into buffer space.
    //    `orientation` means: upright = buffer rotated counter-clockwise by
    //    `orientation.degrees`, so the inverse rotation is applied here.
    let rotation: CGAffineTransform
    switch orientation {
    case .up:
      rotation = .identity
    case .left:
      // (x, y) -> (y, 1 - x)
      rotation = CGAffineTransform(translationX: 0, y: 1).rotated(by: -.pi / 2)
    case .right:
      // (x, y) -> (1 - y, x)
      rotation = CGAffineTransform(translationX: 1, y: 0).rotated(by: .pi / 2)
    case .down:
      // (x, y) -> (1 - x, 1 - y)
      rotation = CGAffineTransform(translationX: 1, y: 1).rotated(by: .pi)
    }
    matrix = matrix.concatenating(rotation)

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
