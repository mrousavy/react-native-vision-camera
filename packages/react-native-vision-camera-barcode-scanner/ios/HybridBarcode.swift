//
//  HybridBarcode.swift
//  VisionCameraBarcodeScanner
//
//  Created by Marc Rousavy on 08.02.26.
//

import CoreGraphics
import MLKitBarcodeScanning
import NitroModules

final class HybridBarcode: HybridBarcodeSpec {
  private let barcode: Barcode
  /**
   * Converts MLKit result coordinates into oriented (display-space) Frame
   * coordinates. MLKit on iOS returns coordinates in the raw pixel-buffer's
   * coordinate space, no matter what `MLImage.orientation` is set to.
   */
  private let pointTransform: CGAffineTransform

  init(barcode: Barcode, pointTransform: CGAffineTransform = .identity) {
    self.barcode = barcode
    self.pointTransform = pointTransform
    super.init()
  }

  var format: BarcodeFormat {
    return BarcodeFormat(fromMLKitFormat: barcode.format)
  }

  var boundingBox: Rect {
    let frame = barcode.frame.applying(pointTransform)
    return Rect(
      left: frame.minX,
      right: frame.maxX,
      top: frame.minY,
      bottom: frame.maxY)
  }

  var cornerPoints: [Point] {
    guard let points = barcode.cornerPoints else {
      return []
    }
    return points.map { value in
      guard let point = value as? CGPoint else {
        return Point(x: 0.0, y: 0.0)
      }
      let transformed = point.applying(pointTransform)
      return Point(x: transformed.x, y: transformed.y)
    }
  }

  var displayValue: String? {
    return barcode.displayValue
  }

  lazy var rawBytes: ArrayBuffer? = {
    guard let data = barcode.rawData else {
      return nil
    }
    return try? ArrayBuffer.copy(data: data)
  }()

  var rawValue: String? {
    return barcode.rawValue
  }

  var valueType: BarcodeValueType {
    return BarcodeValueType(fromMLKitValueType: barcode.valueType)
  }
}
