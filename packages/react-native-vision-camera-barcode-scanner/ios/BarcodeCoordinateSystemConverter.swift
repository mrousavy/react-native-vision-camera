//
//  BarcodeCoordinateSystemConverter.swift
//  VisionCameraBarcodeScanner
//
//  Created by Marc Rousavy on 18.05.26.
//

import Foundation
import VisionCamera

final class BarcodeCoordinateSystemConverter {
  private let barcodeWidth: Double
  private let barcodeHeight: Double

  init(
    width: Double,
    height: Double,
    orientation: CameraOrientation,
    isMirrored _: Bool
  ) {
    // ML Kit returns barcode geometry in the detected image's view coordinate system,
    // so orientation/mirroring are already reflected in the Barcode coordinates.
    switch orientation {
    case .up, .down:
      self.barcodeWidth = width
      self.barcodeHeight = height
    case .left, .right:
      self.barcodeWidth = height
      self.barcodeHeight = width
    }
  }

  func convertBarcodePointToCameraPoint(_ barcodePoint: Point) -> Point {
    return Point(
      x: barcodePoint.x / barcodeWidth,
      y: barcodePoint.y / barcodeHeight)
  }

  func convertCameraPointToBarcodePoint(_ cameraPoint: Point) -> Point {
    return Point(
      x: cameraPoint.x * barcodeWidth,
      y: cameraPoint.y * barcodeHeight)
  }
}
