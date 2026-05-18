//
//  BarcodeCoordinateSystemConverter.swift
//  VisionCameraBarcodeScanner
//
//  Created by Marc Rousavy on 18.05.26.
//

import CoreGraphics
import Foundation
import VisionCamera

final class BarcodeCoordinateSystemConverter {
  private let barcodeToCameraMatrix: CGAffineTransform
  private let cameraToBarcodeMatrix: CGAffineTransform

  init(
    width: Double,
    height: Double,
    orientation: CameraOrientation,
    isMirrored: Bool
  ) {
    var matrix = CGAffineTransform.identity

    switch orientation {
    case .up:
      break
    case .down:
      matrix =
        matrix
        .translatedBy(x: 1, y: 1)
        .rotated(by: .pi)
    case .left:
      matrix =
        matrix
        .translatedBy(x: 1, y: 0)
        .rotated(by: .pi / 2)
    case .right:
      matrix =
        matrix
        .translatedBy(x: 0, y: 1)
        .rotated(by: -.pi / 2)
    }

    if isMirrored {
      let mirror = CGAffineTransform.identity
        .translatedBy(x: 1, y: 0)
        .scaledBy(x: -1, y: 1)
      matrix = mirror.concatenating(matrix)
    }

    matrix = matrix.scaledBy(x: 1 / width, y: 1 / height)

    self.barcodeToCameraMatrix = matrix
    self.cameraToBarcodeMatrix = matrix.inverted()
  }

  func convertBarcodePointToCameraPoint(_ barcodePoint: Point) -> Point {
    return barcodePoint.applying(barcodeToCameraMatrix)
  }

  func convertCameraPointToBarcodePoint(_ cameraPoint: Point) -> Point {
    return cameraPoint.applying(cameraToBarcodeMatrix)
  }
}

extension Point {
  fileprivate func applying(_ transform: CGAffineTransform) -> Point {
    let point = CGPoint(x: x, y: y).applying(transform)
    return Point(x: point.x, y: point.y)
  }
}
