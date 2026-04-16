//
//  HybridBarcode.swift
//  VisionCameraBarcodeScanner
//
//  Created by Marc Rousavy on 08.02.26.
//

import MLKitBarcodeScanning
import NitroModules

final class HybridBarcode: HybridBarcodeSpec {
  private let barcode: Barcode

  init(barcode: Barcode) {
    self.barcode = barcode
    super.init()
  }

  var format: BarcodeFormat {
    return BarcodeFormat(fromMLKitFormat: barcode.format)
  }

  var boundingBox: Rect {
    let frame = barcode.frame
    return Rect(
      left: frame.origin.x,
      right: frame.origin.x + frame.size.width,
      top: frame.origin.y,
      bottom: frame.origin.y + frame.size.height)
  }

  var cornerPoints: [Point] {
    guard let points = barcode.cornerPoints else {
      return []
    }
    return points.map { value in
      guard let point = value as? CGPoint else {
        return Point(x: 0.0, y: 0.0)
      }
      return Point(x: point.x, y: point.y)
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
